import { NextRequest } from "next/server";

import { prisma } from "@/prisma/client";
import { createNotification } from "@/utilities/fetch";
import { shouldCreateNotification } from "@/utilities/misc/shouldCreateNotification";
import { getAuthenticatedUser, unauthorizedResponse } from "@/utilities/auth/session";
import { canUsersInteract } from "@/utilities/social/access";
import { errorResponse, getRequestId, logApiEvent, successResponse } from "@/utilities/observability";

export async function POST(request: NextRequest) {
    const requestId = getRequestId(request);
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse("Unauthorized");

    const secret = process.env.CREATION_SECRET_KEY;

    if (!secret) {
        return errorResponse(requestId, "Secret key not found.", 500);
    }

    // Parse request body
    const { recipient, text, photoUrl } = await request.json();

    // Validate input
    if (!text || typeof text !== 'string') {
        return errorResponse(requestId, "Text is required", 400);
    }

    if (text.length === 0 || text.length > 280) {
        return errorResponse(requestId, "Text must be 1-280 characters", 400);
    }

    if (!recipient || typeof recipient !== 'string') {
        return errorResponse(requestId, "Recipient is required", 400);
    }

    // Sanitize photoUrl
    const sanitizedPhotoUrl = photoUrl && typeof photoUrl === 'string'
        ? (photoUrl.startsWith('/uploads/') || photoUrl.startsWith('http'))
            ? photoUrl
            : null
        : null;

    try {
        const recipientUser = await prisma.user.findUnique({
            where: {
                username: recipient,
            },
            select: {
                id: true,
                username: true,
                messagePrivacy: true,
                followers: {
                    select: {
                        id: true,
                    },
                },
            },
        });

        if (!recipientUser) {
            return errorResponse(requestId, "Recipient does not exist.", 404);
        }

        const relation = await canUsersInteract(authUser.id, recipientUser.id);
        if (relation.blocked) {
            return errorResponse(requestId, "Messaging is not allowed due to account restrictions.", 403);
        }

        if (
            recipientUser.messagePrivacy === "followers" &&
            recipientUser.username !== authUser.username &&
            !recipientUser.followers.some((follower) => follower.id === authUser.id)
        ) {
            return errorResponse(requestId, "This user only accepts messages from followers.", 403);
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

        logApiEvent("info", {
            event: "message_created",
            requestId,
            route: "/api/messages/create",
            details: {
                senderId: authUser.id,
                recipientId: recipientUser.id,
                hasPhoto: Boolean(sanitizedPhotoUrl),
            },
        });

        return successResponse(requestId, { success: true });
    } catch (error: unknown) {
        return errorResponse(requestId, "Failed to create message.", 500, error);
    }
}
