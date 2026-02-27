import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { createNotification } from "@/utilities/fetch";
import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";
import { canUsersInteract } from "@/utilities/social/access";

export async function POST(
    request: NextRequest,
    { params: { tweetId, username } }: { params: { tweetId: string; username: string } }
) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();

    const secret = process.env.CREATION_SECRET_KEY;

    if (!secret) {
        return NextResponse.json({
            success: false,
            message: "Secret key not found.",
        });
    }

    try {
        const targetTweet = await prisma.tweet.findUnique({
            where: {
                id: tweetId,
            },
            select: {
                id: true,
                authorId: true,
                author: {
                    select: {
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

        const relation = await canUsersInteract(authUser.id, targetTweet.authorId);
        if (relation.blocked) {
            return NextResponse.json(
                { success: false, message: "You cannot interact with this user due to account restrictions." },
                { status: 403 }
            );
        }

        if (targetTweet.author.isPrivate && targetTweet.authorId !== authUser.id && targetTweet.author.followers.length === 0) {
            return NextResponse.json(
                { success: false, message: "This account is private. Follow first to interact." },
                { status: 403 }
            );
        }

        await prisma.tweet.update({
            where: {
                id: tweetId,
            },
            data: {
                likedBy: {
                    connect: {
                        id: authUser.id,
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

            await createNotification(username, "like", secret, notificationContent);
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}
