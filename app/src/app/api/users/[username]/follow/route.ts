import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { createNotification } from "@/utilities/fetch";
import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";
import { canUsersInteract } from "@/utilities/social/access";

export async function POST(request: NextRequest, { params: { username } }: { params: { username: string } }) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();

    const targetUser = await prisma.user.findUnique({
        where: {
            username,
        },
        select: {
            id: true,
        },
    });

    if (!targetUser) {
        return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    if (targetUser.id === authUser.id) {
        return NextResponse.json({ success: false, message: "You cannot follow yourself." }, { status: 400 });
    }

    const relation = await canUsersInteract(authUser.id, targetUser.id);
    if (relation.blocked) {
        return NextResponse.json({ success: false, message: "Follow is not allowed due to account restrictions." }, { status: 403 });
    }

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
                id: targetUser.id,
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
