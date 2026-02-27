import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";

export async function GET(request: NextRequest) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();

    try {
        const notifications = await prisma.notification.findMany({
            where: {
                userId: authUser.id,
            },
            include: {
                user: {
                    select: {
                        username: true,
                        name: true,
                        photoUrl: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return NextResponse.json({ success: true, notifications });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}
