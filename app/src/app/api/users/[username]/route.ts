import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { getAuthenticatedUser } from "@/utilities/auth/session";
import { canUsersInteract } from "@/utilities/social/access";

export async function GET(request: NextRequest, { params: { username } }: { params: { username: string } }) {
    try {
        const authUser = await getAuthenticatedUser();

        const user = await prisma.user.findUnique({
            where: {
                username: username,
            },
            select: {
                id: true,
                name: true,
                username: true,
                createdAt: true,
                updatedAt: true,
                description: true,
                location: true,
                website: true,
                isVerifiedHuman: true,
                isPrivate: true,
                messagePrivacy: true,
                photoUrl: true,
                headerUrl: true,
                followers: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        description: true,
                        isVerifiedHuman: true,
                        photoUrl: true,
                        followers: {
                            select: {
                                id: true,
                            },
                        },
                        following: {
                            select: {
                                id: true,
                            },
                        },
                    },
                },
                following: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        description: true,
                        isVerifiedHuman: true,
                        photoUrl: true,
                        followers: {
                            select: {
                                id: true,
                            },
                        },
                        following: {
                            select: {
                                id: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ success: true, user: null });
        }

        let isBlockedByMe = false;
        let hasBlockedMe = false;
        let isMutedByMe = false;
        let canViewContent = !user.isPrivate;

        if (authUser) {
            const relation = await canUsersInteract(authUser.id, user.id);
            isBlockedByMe = relation.blockedByViewer;
            hasBlockedMe = relation.blockedByTarget;
            isMutedByMe = relation.muted;

            const isFollowing = user.followers.some((follower) => follower.id === authUser.id);
            const isOwner = authUser.id === user.id;
            canViewContent = (user.isPrivate ? isFollowing || isOwner : true) && !relation.blocked;
        } else {
            canViewContent = !user.isPrivate;
        }

        return NextResponse.json({
            success: true,
            user: { ...user, isBlockedByMe, hasBlockedMe, isMutedByMe, canViewContent },
        });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}
