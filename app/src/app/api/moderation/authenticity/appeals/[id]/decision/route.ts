import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { getAuthenticatedUser, isModerator, unauthorizedResponse } from "@/utilities/auth/session";

type AppealDecisionPayload = {
    decision?: unknown;
    note?: unknown;
};

const ALLOWED_APPEAL_DECISIONS = new Set(["uphold", "overturn_allow"]);

export async function POST(request: NextRequest, { params: { id } }: { params: { id: string } }) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();
    if (!isModerator(authUser)) {
        return NextResponse.json({ success: false, message: "Moderator access required." }, { status: 403 });
    }

    let body: AppealDecisionPayload;
    try {
        body = (await request.json()) as AppealDecisionPayload;
    } catch {
        return NextResponse.json({ success: false, message: "Invalid JSON payload." }, { status: 400 });
    }

    const decision = typeof body.decision === "string" ? body.decision.trim().toLowerCase() : "";
    const note = typeof body.note === "string" ? body.note.trim() : "";

    if (!ALLOWED_APPEAL_DECISIONS.has(decision)) {
        return NextResponse.json({ success: false, message: "Invalid appeal decision." }, { status: 400 });
    }

    const existing = await prisma.authenticityAppeal.findUnique({
        where: {
            id,
        },
        select: {
            id: true,
            status: true,
            check: {
                select: {
                    id: true,
                    tweetId: true,
                    mediaAssetId: true,
                },
            },
        },
    });

    if (!existing) {
        return NextResponse.json({ success: false, message: "Appeal not found." }, { status: 404 });
    }

    if (!["open", "reviewing"].includes(existing.status)) {
        return NextResponse.json(
            { success: false, message: "Appeal already resolved. Create a new moderation action if needed." },
            { status: 409 }
        );
    }

    const now = new Date();
    const reviewerNote = note ? note.slice(0, 500) : null;

    const updatedAppeal = await prisma.$transaction(async (tx) => {
        const appeal = await tx.authenticityAppeal.update({
            where: {
                id: existing.id,
            },
            data: {
                status: "resolved",
                decision,
                reviewerId: authUser.id,
                reviewerNote,
                reviewedAt: now,
            },
            select: {
                id: true,
                status: true,
                decision: true,
                reviewedAt: true,
            },
        });

        if (decision === "overturn_allow") {
            await tx.authenticityCheck.update({
                where: {
                    id: existing.check.id,
                },
                data: {
                    status: "resolved",
                    decision: "allow",
                    reviewerId: authUser.id,
                    reviewerNote,
                    reviewedAt: now,
                },
            });

            if (existing.check.tweetId) {
                await tx.tweet.update({
                    where: {
                        id: existing.check.tweetId,
                    },
                    data: {
                        visibilityStatus: "public",
                        authenticityDecision: "allow",
                    },
                });
            }

            if (existing.check.mediaAssetId) {
                await tx.mediaAsset.update({
                    where: {
                        id: existing.check.mediaAssetId,
                    },
                    data: {
                        authenticityDecision: "allow",
                        moderationStatus: "approved",
                        moderationReason: reviewerNote ? reviewerNote.slice(0, 160) : "appeal_overturn_allow",
                    },
                });
            }
        }

        return appeal;
    });

    console.log(
        JSON.stringify({
            event: "authenticity_appeal_decision",
            appealId: updatedAppeal.id,
            checkId: existing.check.id,
            reviewerId: authUser.id,
            reviewerUsername: authUser.username,
            decision: updatedAppeal.decision,
        })
    );

    return NextResponse.json({ success: true, appeal: updatedAppeal });
}
