import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";
import { sanitizeMediaUrl } from "@/utilities/misc/sanitizeMediaUrl";

type EditTweetPayload = {
    text?: unknown;
    photoUrl?: unknown;
};

export async function POST(
    request: NextRequest,
    { params: { tweetId, username } }: { params: { tweetId: string; username: string } }
) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();

    let body: EditTweetPayload;
    try {
        body = (await request.json()) as EditTweetPayload;
    } catch {
        return NextResponse.json({ success: false, message: "Invalid JSON payload." }, { status: 400 });
    }

    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text || text.length > 280) {
        return NextResponse.json({ success: false, message: "Text must be between 1 and 280 characters." }, { status: 400 });
    }

    const hasPhotoUrl = Object.prototype.hasOwnProperty.call(body, "photoUrl");
    let nextPhotoUrl: string | null | undefined;
    if (hasPhotoUrl) {
        if (body.photoUrl === null) {
            nextPhotoUrl = null;
        } else if (typeof body.photoUrl === "string" && body.photoUrl.trim() === "") {
            nextPhotoUrl = null;
        } else {
            const sanitized = sanitizeMediaUrl(body.photoUrl);
            if (!sanitized) {
                return NextResponse.json({ success: false, message: "photoUrl must be a valid upload URL." }, { status: 400 });
            }
            nextPhotoUrl = sanitized;
        }
    }

    const target = await prisma.tweet.findUnique({
        where: { id: tweetId },
        select: {
            id: true,
            authorId: true,
            author: { select: { username: true } },
            isRetweet: true,
        },
    });

    if (!target || target.author.username !== username) {
        return NextResponse.json({ success: false, message: "Post not found." }, { status: 404 });
    }
    if (target.isRetweet) {
        return NextResponse.json({ success: false, message: "Reposts cannot be edited." }, { status: 400 });
    }
    if (target.authorId !== authUser.id) {
        return unauthorizedResponse();
    }

    const updated = await prisma.tweet.update({
        where: { id: tweetId },
        data: {
            text,
            editedAt: new Date(),
            ...(hasPhotoUrl ? { photoUrl: nextPhotoUrl ?? null } : {}),
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
            retweetedBy: {
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
            replies: {
                select: {
                    authorId: true,
                },
            },
            retweetOf: {
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
                    retweetedBy: {
                        select: {
                            id: true,
                            username: true,
                            name: true,
                            description: true,
                            isVerifiedHuman: true,
                            photoUrl: true,
                        },
                    },
                    replies: {
                        select: {
                            authorId: true,
                        },
                    },
                },
            },
        },
    });

    return NextResponse.json({ success: true, tweet: updated });
}
