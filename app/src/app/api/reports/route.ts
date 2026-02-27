import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";

type ReportPayload = {
    targetType?: "user" | "tweet";
    targetUsername?: string;
    targetTweetId?: string;
    reason?: string;
    details?: string;
};

export async function POST(request: NextRequest) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();

    const body = (await request.json()) as ReportPayload;
    const targetType = body.targetType;
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const details = typeof body.details === "string" ? body.details.trim() : "";

    if (!targetType || (targetType !== "user" && targetType !== "tweet")) {
        return NextResponse.json({ success: false, message: "Invalid target type." }, { status: 400 });
    }

    if (!reason || reason.length > 80) {
        return NextResponse.json({ success: false, message: "Invalid reason." }, { status: 400 });
    }

    if (details.length > 500) {
        return NextResponse.json({ success: false, message: "Report details are too long." }, { status: 400 });
    }

    try {
        let targetUserId: string | null = null;
        let targetTweetId: string | null = null;

        if (targetType === "user") {
            const targetUsername = typeof body.targetUsername === "string" ? body.targetUsername.trim() : "";
            if (!targetUsername) {
                return NextResponse.json({ success: false, message: "Missing target username." }, { status: 400 });
            }

            const targetUser = await prisma.user.findUnique({
                where: {
                    username: targetUsername,
                },
                select: {
                    id: true,
                },
            });

            if (!targetUser) {
                return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
            }
            targetUserId = targetUser.id;
        }

        if (targetType === "tweet") {
            const candidateTweetId = typeof body.targetTweetId === "string" ? body.targetTweetId.trim() : "";
            if (!candidateTweetId) {
                return NextResponse.json({ success: false, message: "Missing target tweet." }, { status: 400 });
            }

            const targetTweet = await prisma.tweet.findUnique({
                where: {
                    id: candidateTweetId,
                },
                select: {
                    id: true,
                },
            });

            if (!targetTweet) {
                return NextResponse.json({ success: false, message: "Tweet not found." }, { status: 404 });
            }
            targetTweetId = targetTweet.id;
        }

        await prisma.report.create({
            data: {
                reporterId: authUser.id,
                targetUserId,
                targetTweetId,
                reason,
                details: details || null,
                status: "open",
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error }, { status: 500 });
    }
}
