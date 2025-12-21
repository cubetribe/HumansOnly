import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { createNotification } from "@/utilities/fetch";
import { shouldCreateNotification } from "@/utilities/misc/shouldCreateNotification";
import { UserProps } from "@/types/UserProps";

export async function POST(request: NextRequest) {
    // Verify authentication first
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const verifiedToken: UserProps = await verifyJwtToken(token);

    if (!verifiedToken || !verifiedToken.username) {
        return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    const secret = process.env.CREATION_SECRET_KEY;

    if (!secret) {
        return NextResponse.json({
            success: false,
            message: "Secret key not found.",
        });
    }

    // Parse request body
    const { recipient, sender, text, photoUrl } = await request.json();

    // Validate sender matches token
    if (verifiedToken.username !== sender) {
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });
    }

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
                sender: {
                    connect: {
                        username: sender,
                    },
                },
                recipient: {
                    connect: {
                        username: recipient,
                    },
                },
            },
        });

        if (recipient !== verifiedToken.username && (await shouldCreateNotification(verifiedToken.username, recipient))) {
            const notificationContent = {
                sender: {
                    username: verifiedToken.username,
                    name: verifiedToken.name,
                    photoUrl: verifiedToken.photoUrl,
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
