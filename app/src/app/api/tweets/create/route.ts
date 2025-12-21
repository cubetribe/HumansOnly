import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { UserProps } from "@/types/UserProps";

export async function POST(request: NextRequest) {
    // Verify authentication first
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const verifiedToken: UserProps = await verifyJwtToken(token);

    if (!verifiedToken || !verifiedToken.id) {
        return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    // Extract authorId from JWT (secure)
    const authorId = verifiedToken.id;

    // Parse request body
    const { text, photoUrl } = await request.json();

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

    // Sanitize photoUrl
    const sanitizedPhotoUrl = photoUrl && typeof photoUrl === 'string'
        ? (photoUrl.startsWith('/uploads/') || photoUrl.startsWith('http'))
            ? photoUrl
            : null
        : null;

    try {
        await prisma.tweet.create({
            data: {
                text,
                photoUrl: sanitizedPhotoUrl,
                author: {
                    connect: {
                        id: authorId,
                    },
                },
            },
        });
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}
