import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";

export async function POST(request: NextRequest, { params: { username } }: { params: { username: string } }) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();

    try {
        const target = await prisma.user.findUnique({
            where: {
                username,
            },
            select: {
                id: true,
                username: true,
            },
        });

        if (!target) {
            return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
        }

        if (target.id === authUser.id) {
            return NextResponse.json({ success: false, message: "You cannot block yourself." }, { status: 400 });
        }

        await prisma.$transaction([
            prisma.block.upsert({
                where: {
                    blockerId_blockedId: {
                        blockerId: authUser.id,
                        blockedId: target.id,
                    },
                },
                update: {},
                create: {
                    blockerId: authUser.id,
                    blockedId: target.id,
                },
            }),
            prisma.mute.upsert({
                where: {
                    muterId_mutedId: {
                        muterId: authUser.id,
                        mutedId: target.id,
                    },
                },
                update: {},
                create: {
                    muterId: authUser.id,
                    mutedId: target.id,
                },
            }),
            prisma.user.update({
                where: {
                    id: target.id,
                },
                data: {
                    followers: {
                        disconnect: {
                            id: authUser.id,
                        },
                    },
                },
            }),
            prisma.user.update({
                where: {
                    id: authUser.id,
                },
                data: {
                    followers: {
                        disconnect: {
                            id: target.id,
                        },
                    },
                },
            }),
        ]);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error }, { status: 500 });
    }
}
