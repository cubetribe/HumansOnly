import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";

const MESSAGE_PRIVACY_OPTIONS = new Set(["everyone", "followers"]);

export async function GET() {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();

    try {
        const user = await prisma.user.findUnique({
            where: {
                id: authUser.id,
            },
            select: {
                isPrivate: true,
                messagePrivacy: true,
            },
        });

        return NextResponse.json({ success: true, preferences: user });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body?.isPrivate === "boolean") {
        updates.isPrivate = body.isPrivate;
    }

    if (typeof body?.messagePrivacy === "string") {
        if (!MESSAGE_PRIVACY_OPTIONS.has(body.messagePrivacy)) {
            return NextResponse.json({ success: false, message: "Invalid message privacy value." }, { status: 400 });
        }
        updates.messagePrivacy = body.messagePrivacy;
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ success: false, message: "No valid preference fields provided." }, { status: 400 });
    }

    try {
        const user = await prisma.user.update({
            where: {
                id: authUser.id,
            },
            data: updates,
            select: {
                isPrivate: true,
                messagePrivacy: true,
            },
        });

        return NextResponse.json({ success: true, preferences: user });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error }, { status: 500 });
    }
}
