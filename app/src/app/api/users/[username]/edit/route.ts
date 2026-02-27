import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT } from "jose";

import { prisma } from "@/prisma/client";
import { getJwtSecretKey, verifyJwtToken } from "@/utilities/auth";
import { buildAuthCookie } from "@/utilities/auth/cookies";
import { UserProps } from "@/types/UserProps";

export async function POST(request: NextRequest, { params: { username } }: { params: { username: string } }) {
    const body = await request.json();
    const { name, description, location, website, photoUrl, headerUrl, isVerifiedHuman, verificationCode } = body;

    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    const verifiedToken: UserProps = token && (await verifyJwtToken(token));

    if (!verifiedToken)
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });

    if (verifiedToken.username !== username)
        return NextResponse.json({ success: false, message: "You are not authorized to perform this action." });

    const hasPhotoUrl = Object.prototype.hasOwnProperty.call(body, "photoUrl");
    const hasHeaderUrl = Object.prototype.hasOwnProperty.call(body, "headerUrl");
    const wantsVerifiedHuman = isVerifiedHuman === true;

    if (wantsVerifiedHuman) {
        const providedCode = typeof verificationCode === "string" ? verificationCode : "";
        if (!process.env.BLUE_SECRET_KEY || providedCode !== process.env.BLUE_SECRET_KEY) {
            return NextResponse.json({ success: false, message: "Invalid verification code." }, { status: 400 });
        }
    }

    const sanitizeImagePath = (value: unknown): string | null => {
        if (typeof value !== "string" || value.trim() === "") return null;
        return value.startsWith("/uploads/") || value.startsWith("http://") || value.startsWith("https://")
            ? value
            : null;
    };

    const sanitizedPhotoUrl = hasPhotoUrl ? sanitizeImagePath(photoUrl) : undefined;
    const sanitizedHeaderUrl = hasHeaderUrl ? sanitizeImagePath(headerUrl) : undefined;

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
                isVerifiedHuman: wantsVerifiedHuman ? true : undefined,
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
