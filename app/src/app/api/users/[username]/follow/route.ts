import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { createNotification } from "@/utilities/fetch";
import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";

export async function POST(request: NextRequest, { params: { username } }: { params: { username: string } }) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();

    const secret = process.env.CREATION_SECRET_KEY;

    if (!secret) {
        return NextResponse.json({
            success: false,
            message: "Secret key not found.",
        });
    }

    try {
        await prisma.user.update({
            where: {
                username: username,
            },
            data: {
                followers: {
                    connect: {
                        id: authUser.id,
                    },
                },
            },
        });

        const notificationContent = {
            sender: {
                username: authUser.username,
                name: authUser.name || "",
                photoUrl: authUser.photoUrl || "",
            },
            content: null,
        };

        await createNotification(username, "follow", secret, notificationContent);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}
