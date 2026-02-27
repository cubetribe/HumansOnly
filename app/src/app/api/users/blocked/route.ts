import { NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";

export async function GET() {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();

    try {
        const blocked = await prisma.block.findMany({
            where: {
                blockerId: authUser.id,
            },
            include: {
                blocked: {
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

        return NextResponse.json({ success: true, users: blocked.map((entry) => entry.blocked) });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error }, { status: 500 });
    }
}
