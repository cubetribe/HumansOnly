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

    // Parse request body
    const { tokenOwnerId, participants }: { tokenOwnerId: string; participants: string[] } = await request.json();

    // Validate tokenOwnerId safely
    if (!tokenOwnerId || typeof tokenOwnerId !== 'string') {
        return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
    }

    // Validate participants
    if (!Array.isArray(participants) || participants.length !== 2) {
        return NextResponse.json({ success: false, message: "Invalid participants" }, { status: 400 });
    }

    // Verify token owner matches
    if (verifiedToken.id !== tokenOwnerId) {
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });
    }

    // Verify token owner is one of the participants
    if (!participants.includes(verifiedToken.username)) {
        return NextResponse.json({ success: false, message: "You are not authorized to delete these messages." });
    }

    try {
        await prisma.message.deleteMany({
            where: {
                OR: [
                    {
                        sender: {
                            username: participants[0],
                        },
                        recipient: {
                            username: participants[1],
                        },
                    },
                    {
                        sender: {
                            username: participants[1],
                        },
                        recipient: {
                            username: participants[0],
                        },
                    },
                ],
            },
        });
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}
