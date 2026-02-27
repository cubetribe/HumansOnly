import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { NotificationProps } from "@/types/NotificationProps";

export async function POST(request: NextRequest) {
    const { recipient, type, secret, notificationContent }: NotificationProps = await request.json();

    if (secret !== process.env.CREATION_SECRET_KEY) {
        return NextResponse.json({ success: false, error: "Invalid secret." }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                username: recipient,
            },
            select: {
                id: true,
            },
        });

        if (!user) {
            return NextResponse.json({ success: false, error: "Recipient not found." }, { status: 404 });
        }

        const preferences = await prisma.notificationPreference.findUnique({
            where: {
                userId: user.id,
            },
        });

        const preferenceKeyByType: Record<string, "like" | "reply" | "follow" | "retweet" | "message"> = {
            like: "like",
            reply: "reply",
            follow: "follow",
            retweet: "retweet",
            message: "message",
        };

        const preferenceKey = preferenceKeyByType[type];
        if (preferenceKey && preferences && preferences[preferenceKey] === false) {
            return NextResponse.json({ success: true, skipped: true });
        }

        await prisma.notification.create({
            data: {
                user: {
                    connect: {
                        id: user.id,
                    },
                },
                type: type,
                content: JSON.stringify(notificationContent),
            },
        });
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error }, { status: 500 });
    }
}
