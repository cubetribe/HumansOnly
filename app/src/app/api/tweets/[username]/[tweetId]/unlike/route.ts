import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";

export async function POST(request: NextRequest, { params: { tweetId } }: { params: { tweetId: string } }) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();

    try {
        await prisma.tweet.update({
            where: {
                id: tweetId,
            },
            data: {
                likedBy: {
                    disconnect: {
                        id: authUser.id,
                    },
                },
            },
        });
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}
