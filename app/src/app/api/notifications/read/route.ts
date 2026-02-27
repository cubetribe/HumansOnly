import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";

export async function GET(request: NextRequest) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();

    try {
        const result = await prisma.notification.updateMany({
            where: {
                userId: authUser.id,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });
        return NextResponse.json({ success: true, marked: result.count });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}
