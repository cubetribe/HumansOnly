import { NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";

export async function GET() {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();

    try {
        const muted = await prisma.mute.findMany({
            where: {
                muterId: authUser.id,
            },
            include: {
                muted: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        photoUrl: true,
                        isVerifiedHuman: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({ success: true, users: muted.map((entry) => entry.muted) });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error }, { status: 500 });
    }
}
