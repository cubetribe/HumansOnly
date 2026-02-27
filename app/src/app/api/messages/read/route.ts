import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";

export async function POST(request: NextRequest) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    const messagedUsername = typeof body?.messagedUsername === "string" ? body.messagedUsername.trim() : "";

    if (!messagedUsername) {
        return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
    }

    try {
        const updated = await prisma.message.updateMany({
            where: {
                sender: {
                    username: messagedUsername,
                },
                recipient: {
                    username: authUser.username,
                },
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        return NextResponse.json({ success: true, marked: updated.count });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error }, { status: 500 });
    }
}
