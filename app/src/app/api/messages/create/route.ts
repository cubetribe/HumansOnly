import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { createNotification } from "@/utilities/fetch";
import { shouldCreateNotification } from "@/utilities/misc/shouldCreateNotification";
import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";

export async function POST(request: NextRequest) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse("Unauthorized");

    const secret = process.env.CREATION_SECRET_KEY;

    if (!secret) {
        return NextResponse.json({
            success: false,
            message: "Secret key not found.",
        });
    }

    // Parse request body
    const { recipient, text, photoUrl } = await request.json();

    // Validate input
    if (!text || typeof text !== 'string') {
        return NextResponse.json({
            success: false,
            message: "Text is required"
        }, { status: 400 });
    }

    if (text.length === 0 || text.length > 280) {
        return NextResponse.json({
            success: false,
            message: "Text must be 1-280 characters"
        }, { status: 400 });
    }

    if (!recipient || typeof recipient !== 'string') {
        return NextResponse.json({
            success: false,
            message: "Recipient is required"
        }, { status: 400 });
    }

    // Sanitize photoUrl
    const sanitizedPhotoUrl = photoUrl && typeof photoUrl === 'string'
        ? (photoUrl.startsWith('/uploads/') || photoUrl.startsWith('http'))
            ? photoUrl
            : null
        : null;

    try {
        const isRecipient = await prisma.user.findUnique({
            where: {
                username: recipient,
            },
        });

        if (!isRecipient) {
            return NextResponse.json({ success: false, message: "Recipient does not exist." });
        }

        await prisma.message.create({
            data: {
                text,
                photoUrl: sanitizedPhotoUrl,
                isRead: false,
                sender: {
                    connect: {
                        username: authUser.username,
                    },
                },
                recipient: {
                    connect: {
                        username: recipient,
                    },
                },
            },
        });

        if (recipient !== authUser.username && (await shouldCreateNotification(authUser.username, recipient))) {
            const notificationContent = {
                sender: {
                    username: authUser.username,
                    name: authUser.name || "",
                    photoUrl: authUser.photoUrl || "",
                },
                content: null,
            };

            await createNotification(recipient, "message", secret, notificationContent);
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}
