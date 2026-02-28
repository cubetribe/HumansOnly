import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { getAuthenticatedUser, isAdmin, unauthorizedResponse } from "@/utilities/auth/session";

export async function GET(request: NextRequest) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();
    if (!isAdmin(authUser)) {
        return NextResponse.json({ success: false, message: "Admin access required." }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = (searchParams.get("q") || "").trim();
    const limitRaw = Number.parseInt(searchParams.get("limit") || "30", 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 30;

    const users = await prisma.user.findMany({
        where: query
            ? {
                  OR: [
                      { username: { contains: query, mode: "insensitive" } },
                      { name: { contains: query, mode: "insensitive" } },
                  ],
              }
            : undefined,
        orderBy: [{ role: "desc" }, { createdAt: "desc" }],
        take: limit,
        select: {
            id: true,
            username: true,
            name: true,
            role: true,
            isVerifiedHuman: true,
            createdAt: true,
            photoUrl: true,
        },
    });

    return NextResponse.json({ success: true, users });
}
