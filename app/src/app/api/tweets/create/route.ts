import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";
import { sanitizeMediaUrl } from "@/utilities/misc/sanitizeMediaUrl";
import { runHumanGate } from "@/utilities/human/gate";

type CreateTweetPayload = {
    text?: unknown;
    photoUrl?: unknown;
    challengeSessionId?: unknown;
    ruleVersion?: unknown;
};

export async function POST(request: NextRequest) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse("Unauthorized");

    let body: CreateTweetPayload;
    try {
        body = (await request.json()) as CreateTweetPayload;
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

    const challengeSessionId = typeof body.challengeSessionId === "string" ? body.challengeSessionId.trim() : null;
    const ruleVersion = typeof body.ruleVersion === "string" ? body.ruleVersion.trim() : null;

    const gate = await runHumanGate({
        authUser,
        action: "post_create",
        text: normalizedText,
        hasMedia: Boolean(sanitizedPhotoUrl),
        challengeSessionId,
        ruleVersion,
        metadata: {
            route: "/api/tweets/create",
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

    if (gate.decision !== "allow") {
        return NextResponse.json(
            {
                success: true,
                pendingReview: true,
                message: "Post submitted for authenticity review before publication.",
                checkId: gate.authenticityCheckId,
                riskScore: gate.risk.score,
                suggestedDecision: gate.suggestedDecision,
            },
            { status: 202 }
        );
    }

    try {
        const created = await prisma.tweet.create({
            data: {
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

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}
