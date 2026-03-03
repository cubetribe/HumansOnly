import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { createNotification } from "@/utilities/fetch";
import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";
import { canUsersInteract, visibleAuthorWhereForViewer, visibleTweetWhereForViewer } from "@/utilities/social/access";
import { sanitizeMediaUrl } from "@/utilities/misc/sanitizeMediaUrl";
import { runHumanGate } from "@/utilities/human/gate";

type CreateReplyPayload = {
    text?: unknown;
    photoUrl?: unknown;
    challengeSessionId?: unknown;
    ruleVersion?: unknown;
};

export async function GET(request: NextRequest, { params: { tweetId } }: { params: { tweetId: string } }) {
    const authUser = await getAuthenticatedUser();
    const viewerId = authUser?.id ?? null;
    const visibleAuthorWhere = visibleAuthorWhereForViewer(viewerId);
    const visibleTweetWhere = visibleTweetWhereForViewer(viewerId);

    try {
        const parentTweet = await prisma.tweet.findFirst({
            where: {
                id: tweetId,
                author: visibleAuthorWhere,
                AND: [visibleTweetWhere],
            },
            select: {
                id: true,
            },
        });

        if (!parentTweet) {
            return NextResponse.json({ success: true, tweets: [] });
        }

        const tweets = await prisma.tweet.findMany({
            where: {
                isReply: true,
                repliedToId: tweetId,
                author: visibleAuthorWhere,
                AND: [visibleTweetWhere],
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        description: true,
                        isVerifiedHuman: true,
                        photoUrl: true,
                    },
                },
                likedBy: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        description: true,
                        isVerifiedHuman: true,
                        photoUrl: true,
                        followers: {
                            select: {
                                id: true,
                                username: true,
                                name: true,
                                photoUrl: true,
                            },
                        },
                    },
                },
                repliedTo: {
                    select: {
                        id: true,
                        author: {
                            select: {
                                id: true,
                                username: true,
                                name: true,
                                isVerifiedHuman: true,
                                description: true,
                            },
                        },
                    },
                },
                replies: {
                    select: {
                        authorId: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return NextResponse.json({ success: true, tweets });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}

export async function POST(
    request: NextRequest,
    { params: { tweetId, username } }: { params: { tweetId: string; username: string } }
) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse("Unauthorized");

    const secret = process.env.CREATION_SECRET_KEY;

    if (!secret) {
        return NextResponse.json({
            success: false,
            message: "Secret key not found.",
        });
    }

    let body: CreateReplyPayload;
    try {
        body = (await request.json()) as CreateReplyPayload;
    } catch {
        return NextResponse.json({ success: false, message: "Invalid JSON payload." }, { status: 400 });
    }

    const { text, photoUrl } = body;
    const normalizedText = typeof text === "string" ? text.trim() : "";

    // Validate input
    if (!normalizedText) {
        return NextResponse.json({
            success: false,
            message: "Text is required"
        }, { status: 400 });
    }

    if (normalizedText.length > 280) {
        return NextResponse.json({
            success: false,
            message: "Text must be 1-280 characters"
        }, { status: 400 });
    }

    const hasPhotoUrl = photoUrl !== undefined && photoUrl !== null && !(typeof photoUrl === "string" && photoUrl.trim() === "");
    const sanitizedPhotoUrl = hasPhotoUrl ? sanitizeMediaUrl(photoUrl) : null;
    if (hasPhotoUrl && !sanitizedPhotoUrl) {
        return NextResponse.json({
            success: false,
            message: "photoUrl must be a valid upload URL"
        }, { status: 400 });
    }

    try {
        const targetTweet = await prisma.tweet.findUnique({
            where: {
                id: tweetId,
            },
            select: {
                id: true,
                authorId: true,
                visibilityStatus: true,
                author: {
                    select: {
                        id: true,
                        username: true,
                        isPrivate: true,
                        followers: {
                            where: {
                                id: authUser.id,
                            },
                            select: {
                                id: true,
                            },
                        },
                    },
                },
            },
        });

        if (!targetTweet || targetTweet.author.username !== username) {
            return NextResponse.json({ success: false, message: "Target post not found." }, { status: 404 });
        }
        if (targetTweet.visibilityStatus !== "public" && targetTweet.authorId !== authUser.id) {
            return NextResponse.json({ success: false, message: "This post is not publicly available." }, { status: 403 });
        }

        const relation = await canUsersInteract(authUser.id, targetTweet.authorId);
        if (relation.blocked) {
            return NextResponse.json(
                { success: false, message: "You cannot reply to this user due to account restrictions." },
                { status: 403 }
            );
        }

        if (
            targetTweet.author.isPrivate &&
            targetTweet.authorId !== authUser.id &&
            targetTweet.author.followers.length === 0
        ) {
            return NextResponse.json(
                { success: false, message: "This account is private. Follow first to reply." },
                { status: 403 }
            );
        }

        const challengeSessionId = typeof body.challengeSessionId === "string" ? body.challengeSessionId.trim() : null;
        const ruleVersion = typeof body.ruleVersion === "string" ? body.ruleVersion.trim() : null;

        const gate = await runHumanGate({
            authUser,
            action: "reply_create",
            text: normalizedText,
            hasMedia: Boolean(sanitizedPhotoUrl),
            challengeSessionId,
            ruleVersion,
            metadata: {
                route: "/api/tweets/[username]/[tweetId]/reply",
                targetTweetId: tweetId,
            },
        });

        if (!gate.ok) {
            const statusByCode = {
                rules_not_accepted: 409,
                challenge_required: 403,
                challenge_invalid: 403,
                challenge_misconfigured: 500,
            } as const;

            const status = gate.code ? statusByCode[gate.code] : 400;
            return NextResponse.json(
                {
                    success: false,
                    code: gate.code,
                    message: gate.message,
                    policyVersion: gate.policyVersion,
                },
                { status }
            );
        }

        if (gate.decision === "pending_review") {
            return NextResponse.json(
                {
                    success: true,
                    pendingReview: true,
                    message: "Reply submitted for authenticity review before publication.",
                    checkId: gate.authenticityCheckId,
                    riskScore: gate.risk.score,
                    suggestedDecision: gate.suggestedDecision,
                },
                { status: 202 }
            );
        }
        if (gate.decision === "block") {
            return NextResponse.json(
                {
                    success: false,
                    code: "authenticity_blocked",
                    message: "Reply blocked by authenticity policy. Please contact moderation for review.",
                    checkId: gate.authenticityCheckId,
                    riskScore: gate.risk.score,
                    suggestedDecision: gate.suggestedDecision,
                },
                { status: 403 }
            );
        }

        const created = await prisma.tweet.create({
            data: {
                isReply: true,
                text: normalizedText,
                photoUrl: sanitizedPhotoUrl,
                visibilityStatus: "public",
                authenticityScore: gate.risk.score,
                authenticityDecision: gate.suggestedDecision,
                author: {
                    connect: {
                        id: authUser.id,
                    },
                },
                repliedTo: {
                    connect: {
                        id: tweetId,
                    },
                },
            },
        });

        if (gate.authenticityCheckId) {
            await prisma.authenticityCheck.update({
                where: {
                    id: gate.authenticityCheckId,
                },
                data: {
                    tweetId: created.id,
                },
            });
        }

        if (username !== authUser.username) {
            const notificationContent = {
                sender: {
                    username: authUser.username,
                    name: authUser.name || "",
                    photoUrl: authUser.photoUrl || "",
                },
                content: {
                    id: tweetId,
                },
            };

            await createNotification(username, "reply", secret, notificationContent);
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}
