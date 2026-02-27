import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";

const ensurePreferences = async (userId: string) =>
    prisma.notificationPreference.upsert({
        where: {
            userId,
        },
        update: {},
        create: {
            userId,
        },
    });

export async function GET() {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();

    try {
        const preferences = await ensurePreferences(authUser.id);
        return NextResponse.json({ success: true, preferences });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    const updates = Object.fromEntries(
        ["like", "reply", "follow", "retweet", "message"]
            .filter((key) => typeof body?.[key] === "boolean")
            .map((key) => [key, body[key]])
    );

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ success: false, message: "No valid preference fields provided." }, { status: 400 });
    }

    try {
        const preferences = await prisma.notificationPreference.upsert({
            where: {
                userId: authUser.id,
            },
            update: updates,
            create: {
                userId: authUser.id,
                ...updates,
            },
        });

        return NextResponse.json({ success: true, preferences });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error }, { status: 500 });
    }
}
