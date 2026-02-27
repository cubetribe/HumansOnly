import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT } from "jose";

import { prisma } from "@/prisma/client";
import { getJwtSecretKey, verifyJwtToken } from "@/utilities/auth";
import { buildAuthCookie } from "@/utilities/auth/cookies";
import { UserProps } from "@/types/UserProps";

export async function POST(request: NextRequest, { params: { username } }: { params: { username: string } }) {
    // Parse request body
    const { name, description, location, website, photoUrl, headerUrl } = await request.json();

    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    const verifiedToken: UserProps = token && (await verifyJwtToken(token));

    if (!verifiedToken)
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });

    if (verifiedToken.username !== username)
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });

    // Sanitize photoUrl
    const sanitizedPhotoUrl = photoUrl && typeof photoUrl === 'string'
        ? (photoUrl.startsWith('/uploads/') || photoUrl.startsWith('http://') || photoUrl.startsWith('https://'))
            ? photoUrl
            : null
        : null;

    // Sanitize headerUrl
    const sanitizedHeaderUrl = headerUrl && typeof headerUrl === 'string'
        ? (headerUrl.startsWith('/uploads/') || headerUrl.startsWith('http://') || headerUrl.startsWith('https://'))
            ? headerUrl
            : null
        : null;

    try {
        const user = await prisma.user.update({
            where: {
                username: username,
            },
            data: {
                name,
                description,
                location,
                website,
                photoUrl: sanitizedPhotoUrl,
                headerUrl: sanitizedHeaderUrl,
            },
        });

        const newToken = await new SignJWT({
            id: user.id,
            username: user.username,
            name: user.name,
            description: user.description,
            location: user.location,
            website: user.website,
            isVerifiedHuman: user.isVerifiedHuman,
            createdAt: user.createdAt,
            photoUrl: user.photoUrl,
            headerUrl: user.headerUrl,
        })
            .setProtectedHeader({
                alg: "HS256",
            })
            .setIssuedAt()
            .setExpirationTime("1d")
            .sign(getJwtSecretKey());

        const response = NextResponse.json({
            success: true,
        });
        response.cookies.set(buildAuthCookie(newToken));

        return response;
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error });
    }
}
