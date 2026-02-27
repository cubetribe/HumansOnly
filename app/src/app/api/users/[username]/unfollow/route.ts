import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { UserProps } from "@/types/UserProps";

export async function POST(request: NextRequest, { params: { username } }: { params: { username: string } }) {
    const body = await request.json();
    const tokenOwnerId = typeof body === "string" ? body : body?.tokenOwnerId;

    if (!tokenOwnerId || typeof tokenOwnerId !== "string") {
        return NextResponse.json({ success: false, message: "Invalid payload." }, { status: 400 });
    }

    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    const verifiedToken: UserProps = token && (await verifyJwtToken(token));

    if (!verifiedToken)
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });

    if (verifiedToken.id !== tokenOwnerId)
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });

    try {
        await prisma.user.update({
            where: {
                username: username,
            },
            data: {
                followers: {
                    disconnect: {
                        id: tokenOwnerId,
                    },
                },
            },
        });
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}
