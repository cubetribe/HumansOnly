import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { getAuthenticatedUser, isModerator, unauthorizedResponse } from "@/utilities/auth/session";

export async function POST(
    _request: NextRequest,
    { params: { tweetId, username } }: { params: { tweetId: string; username: string } }
) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();

    try {
        const tweet = await prisma.tweet.findUnique({
            where: {
                id: tweetId,
            },
            select: {
                authorId: true,
                author: {
                    select: {
                        username: true,
                    },
                },
            },
        });

        if (!tweet || tweet.author.username !== username) {
            return NextResponse.json({ success: false, message: "Post not found." }, { status: 404 });
        }

        if (tweet.authorId !== authUser.id && !isModerator(authUser)) {
            return unauthorizedResponse();
        }

        await prisma.tweet.delete({
            where: {
                id: tweetId,
            },
        });
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}
