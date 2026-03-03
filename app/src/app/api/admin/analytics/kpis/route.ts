import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { getAuthenticatedUser, isAdmin, unauthorizedResponse } from "@/utilities/auth/session";
import { errorResponse, getRequestId, successResponse } from "@/utilities/observability";

type EventCountRow = {
    eventName: string;
    count: bigint | number;
};

type DailyEventRow = {
    day: Date;
    eventName: string;
    count: bigint | number;
};

type ActivitySummaryRow = {
    postsCreated: bigint | number;
    repliesCreated: bigint | number;
    activeUsers: bigint | number;
};

const toNumber = (value: bigint | number) => (typeof value === "bigint" ? Number(value) : value);

const resolveWindowDays = (input: string | null) => {
    const parsed = Number.parseInt(input || "7", 10);
    if (!Number.isFinite(parsed)) return 7;
    return Math.min(Math.max(parsed, 1), 90);
};

export async function GET(request: NextRequest) {
    const requestId = getRequestId(request);
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();
    if (!isAdmin(authUser)) {
        return NextResponse.json({ success: false, message: "Admin access required." }, { status: 403 });
    }

    const windowDays = resolveWindowDays(request.nextUrl.searchParams.get("days"));
    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - windowDays * 24 * 60 * 60 * 1000);

    try {
        const [eventCounts, dailyEventSeries, activitySummary] = await Promise.all([
            prisma.$queryRaw<EventCountRow[]>`
                SELECT "eventName", COUNT(*)::bigint AS count
                FROM "ProductEvent"
                WHERE "createdAt" >= ${fromDate}
                GROUP BY "eventName"
                ORDER BY count DESC
            `,
            prisma.$queryRaw<DailyEventRow[]>`
                SELECT date_trunc('day', "createdAt")::timestamp AS day, "eventName", COUNT(*)::bigint AS count
                FROM "ProductEvent"
                WHERE "createdAt" >= ${fromDate}
                GROUP BY day, "eventName"
                ORDER BY day DESC, "eventName" ASC
            `,
            prisma.$queryRaw<ActivitySummaryRow[]>`
                SELECT
                    COUNT(*) FILTER (WHERE "isReply" = false AND "isRetweet" = false AND "createdAt" >= ${fromDate})::bigint AS "postsCreated",
                    COUNT(*) FILTER (WHERE "isReply" = true AND "createdAt" >= ${fromDate})::bigint AS "repliesCreated",
                    (
                        SELECT COUNT(DISTINCT "userId")::bigint
                        FROM "ProductEvent"
                        WHERE "createdAt" >= ${fromDate} AND "userId" IS NOT NULL
                    ) AS "activeUsers"
                FROM "Tweet"
            `,
        ]);

        const normalizedEventCounts = eventCounts.map((row) => ({
            eventName: row.eventName,
            count: toNumber(row.count),
        }));

        const normalizedDailySeries = dailyEventSeries.map((row) => ({
            day: row.day.toISOString().slice(0, 10),
            eventName: row.eventName,
            count: toNumber(row.count),
        }));

        const summary = activitySummary[0] || {
            postsCreated: 0,
            repliesCreated: 0,
            activeUsers: 0,
        };

        return successResponse(requestId, {
            success: true,
            windowDays,
            from: fromDate.toISOString(),
            to: toDate.toISOString(),
            eventCounts: normalizedEventCounts,
            dailyEventSeries: normalizedDailySeries,
            activitySummary: {
                postsCreated: toNumber(summary.postsCreated),
                repliesCreated: toNumber(summary.repliesCreated),
                activeUsers: toNumber(summary.activeUsers),
            },
        });
    } catch (error: unknown) {
        return errorResponse(requestId, "Failed to load analytics KPIs.", 500, error);
    }
}
