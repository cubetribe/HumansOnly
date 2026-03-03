import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";
import { isKnownHumanAction } from "@/utilities/human/config";
import { verifyAndCreateChallengeSession } from "@/utilities/human/challenge";
import { enforceRateLimit } from "@/utilities/security/rateLimit";

type VerifyChallengePayload = {
    action?: unknown;
    token?: unknown;
    ruleVersion?: unknown;
};

const readRequestIp = (request: NextRequest) => {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        const first = forwarded.split(",")[0]?.trim();
        if (first) return first;
    }

    return request.headers.get("x-real-ip") || null;
};

export async function POST(request: NextRequest) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();
    const requestIp = readRequestIp(request) || "unknown";

    const challengeRateLimit = enforceRateLimit({
        key: `challenge_verify:${authUser.id}:${requestIp}`,
        limit: Number.parseInt(process.env.RATE_LIMIT_CHALLENGE_VERIFY_PER_10M || "30", 10),
        windowMs: 10 * 60 * 1000,
    });

    if (!challengeRateLimit.allowed) {
        return NextResponse.json(
            {
                success: false,
                code: "rate_limited",
                message: "Too many challenge verifications. Please retry later.",
            },
            {
                status: 429,
                headers: {
                    "Retry-After": String(challengeRateLimit.retryAfterSeconds),
                },
            }
        );
    }

    let body: VerifyChallengePayload;
    try {
        body = (await request.json()) as VerifyChallengePayload;
    } catch {
        return NextResponse.json({ success: false, message: "Invalid JSON payload." }, { status: 400 });
    }

    if (!isKnownHumanAction(body.action)) {
        return NextResponse.json({ success: false, message: "Invalid action." }, { status: 400 });
    }

    const token = typeof body.token === "string" ? body.token.trim() : "";
    const ruleVersion = typeof body.ruleVersion === "string" ? body.ruleVersion.trim() : null;

    const verification = await verifyAndCreateChallengeSession({
        userId: authUser.id,
        action: body.action,
        token,
        ruleVersion,
        requestHostname: request.nextUrl.hostname,
        requestIp,
    });

    if (!verification.ok) {
        const statusCode = verification.code === "challenge_misconfigured" ? 500 : 403;

        return NextResponse.json(
            {
                success: false,
                code: verification.code,
                message: verification.message,
            },
            { status: statusCode }
        );
    }

    console.log(
        JSON.stringify({
            event: "challenge_verify",
            userId: authUser.id,
            username: authUser.username,
            action: body.action,
            sessionId: verification.sessionId,
            challengeScore: verification.sessionScore,
        })
    );

    return NextResponse.json({
        success: true,
        challengeSessionId: verification.sessionId,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        challengeScore: verification.sessionScore,
        provider: process.env.HUMAN_CHALLENGE_PROVIDER || "turnstile",
    });
}
