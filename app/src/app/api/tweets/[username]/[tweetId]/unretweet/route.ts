import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";

export async function POST(request: NextRequest, { params: { tweetId } }: { params: { tweetId: string } }) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();

    try {
        const originalTweet = await prisma.tweet.findFirst({
            where: {
                id: tweetId,
            },
            include: {
                retweets: true,
            },
        });

        await prisma.tweet.update({
            where: {
                id: tweetId,
            },
            data: {
                retweetedBy: {
                    disconnect: {
                        id: authUser.id,
                    },
                },
            },
        });

        const retweetId = originalTweet?.retweets.find((retweet: any) => retweet.authorId === authUser.id)?.id;

        await prisma.tweet.delete({
            where: {
                id: retweetId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}
