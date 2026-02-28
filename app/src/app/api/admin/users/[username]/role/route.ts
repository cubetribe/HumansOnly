import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { getAuthenticatedUser, isAdmin, unauthorizedResponse } from "@/utilities/auth/session";
import { isUserRole } from "@/types/Role";

type UpdateRolePayload = {
    role?: unknown;
};

export async function POST(request: NextRequest, { params: { username } }: { params: { username: string } }) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();
    if (!isAdmin(authUser)) {
        return NextResponse.json({ success: false, message: "Admin access required." }, { status: 403 });
    }

    let body: UpdateRolePayload;
    try {
        body = (await request.json()) as UpdateRolePayload;
    } catch {
        return NextResponse.json({ success: false, message: "Invalid JSON payload." }, { status: 400 });
    }

    if (!isUserRole(body.role)) {
        return NextResponse.json({ success: false, message: "Invalid role." }, { status: 400 });
    }

    if (authUser.username === username) {
        return NextResponse.json({ success: false, message: "You cannot change your own role." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
        where: { username },
        select: { id: true, username: true, role: true },
    });

    if (!targetUser) {
        return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const updated = await prisma.user.update({
        where: { id: targetUser.id },
        data: { role: body.role },
        select: { id: true, username: true, role: true },
    });

    return NextResponse.json({ success: true, user: updated });
}
