import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";

export async function POST(request: NextRequest) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse("Unauthorized");

    // Parse request body
    const { participants }: { participants: string[] } = await request.json();

    // Validate participants
    if (!Array.isArray(participants) || participants.length !== 2) {
        return NextResponse.json({ success: false, message: "Invalid participants" }, { status: 400 });
    }

    // Verify token owner is one of the participants
    if (!participants.includes(authUser.username)) {
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
