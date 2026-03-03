import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";
import { enforceRateLimit } from "@/utilities/security/rateLimit";

type AppealPayload = {
    checkId?: unknown;
    reason?: unknown;
};

const MAX_REASON_LENGTH = 500;

export async function GET() {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();

    const appeals = await prisma.authenticityAppeal.findMany({
        where: {
            actorId: authUser.id,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 100,
        select: {
            id: true,
            status: true,
            decision: true,
            reason: true,
            reviewerNote: true,
            createdAt: true,
            reviewedAt: true,
            check: {
                select: {
                    id: true,
                    action: true,
                    status: true,
                    decision: true,
                    score: true,
                    trustedTier: true,
                    contentText: true,
                    tweet: {
                        select: {
                            id: true,
                            text: true,
                            visibilityStatus: true,
                        },
                    },
                },
            },
        },
    });

    return NextResponse.json({ success: true, appeals });
}

export async function POST(request: NextRequest) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();

    const rateLimit = enforceRateLimit({
        key: `authenticity_appeal_submit:${authUser.id}`,
        limit: Number.parseInt(process.env.RATE_LIMIT_APPEAL_SUBMIT_PER_DAY || "12", 10),
        windowMs: 24 * 60 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
        return NextResponse.json(
            {
                success: false,
                code: "rate_limited",
                message: "Too many appeals submitted. Please retry later.",
            },
            {
                status: 429,
                headers: {
                    "Retry-After": String(rateLimit.retryAfterSeconds),
                },
            }
        );
    }

    let body: AppealPayload;
    try {
        body = (await request.json()) as AppealPayload;
    } catch {
        return NextResponse.json({ success: false, message: "Invalid JSON payload." }, { status: 400 });
    }

    const checkId = typeof body.checkId === "string" ? body.checkId.trim() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!checkId) {
        return NextResponse.json({ success: false, message: "checkId is required." }, { status: 400 });
    }

    if (reason.length > MAX_REASON_LENGTH) {
        return NextResponse.json({ success: false, message: "Reason must be at most 500 characters." }, { status: 400 });
    }

    const check = await prisma.authenticityCheck.findUnique({
        where: {
            id: checkId,
        },
        select: {
            id: true,
            actorId: true,
            status: true,
            decision: true,
        },
    });

    if (!check) {
        return NextResponse.json({ success: false, message: "Authenticity check not found." }, { status: 404 });
    }

    if (check.actorId !== authUser.id) {
        return NextResponse.json({ success: false, message: "You can only appeal your own checks." }, { status: 403 });
    }

    if (check.decision === "allow") {
        return NextResponse.json({ success: false, message: "Allowed checks cannot be appealed." }, { status: 409 });
    }

    if (check.status !== "resolved") {
        return NextResponse.json(
            {
                success: false,
                message: "This authenticity check is still in moderation. Appeal is available after a final decision.",
            },
            { status: 409 }
        );
    }

    const existingAppeal = await prisma.authenticityAppeal.findUnique({
        where: {
            checkId_actorId: {
                checkId: check.id,
                actorId: authUser.id,
            },
        },
        select: {
            id: true,
            status: true,
        },
    });

    if (existingAppeal) {
        return NextResponse.json(
            {
                success: false,
                message: "An appeal already exists for this check.",
                appealId: existingAppeal.id,
                appealStatus: existingAppeal.status,
            },
            { status: 409 }
        );
    }

    const appeal = await prisma.authenticityAppeal.create({
        data: {
            checkId: check.id,
            actorId: authUser.id,
            status: "open",
            reason: reason ? reason.slice(0, MAX_REASON_LENGTH) : null,
        },
        select: {
            id: true,
            checkId: true,
            status: true,
            reason: true,
            createdAt: true,
        },
    });

    console.log(
        JSON.stringify({
            event: "authenticity_appeal_submitted",
            appealId: appeal.id,
            checkId: appeal.checkId,
            actorId: authUser.id,
            actorUsername: authUser.username,
        })
    );

    return NextResponse.json({ success: true, appeal }, { status: 201 });
}
