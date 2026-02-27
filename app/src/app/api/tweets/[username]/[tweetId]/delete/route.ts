import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";

export async function POST(request: NextRequest, { params: { tweetId } }: { params: { tweetId: string } }) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();

    try {
        const tweet = await prisma.tweet.findUnique({
            where: {
                id: tweetId,
            },
            select: {
                authorId: true,
            },
        });

        if (!tweet || tweet.authorId !== authUser.id) {
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
