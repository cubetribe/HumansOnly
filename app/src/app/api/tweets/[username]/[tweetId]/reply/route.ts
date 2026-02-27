import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { createNotification } from "@/utilities/fetch";
import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";

export async function GET(request: NextRequest, { params: { tweetId } }: { params: { tweetId: string } }) {
    try {
        const tweets = await prisma.tweet.findMany({
            where: {
                isReply: true,
                repliedToId: tweetId,
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

    // Parse request body
    const { text, photoUrl } = await request.json();

    // Validate input
    if (!text || typeof text !== 'string') {
        return NextResponse.json({
            success: false,
            message: "Text is required"
        }, { status: 400 });
    }

    if (text.length === 0 || text.length > 280) {
        return NextResponse.json({
            success: false,
            message: "Text must be 1-280 characters"
        }, { status: 400 });
    }

    // Sanitize photoUrl
    const sanitizedPhotoUrl = photoUrl && typeof photoUrl === 'string'
        ? (photoUrl.startsWith('/uploads/') || photoUrl.startsWith('http'))
            ? photoUrl
            : null
        : null;

    try {
        await prisma.tweet.create({
            data: {
                isReply: true,
                text,
                photoUrl: sanitizedPhotoUrl,
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
