import { auth } from "@clerk/nextjs/server";
import { SignJWT } from "jose";
import { NextResponse } from "next/server";

import { prisma } from "@/prisma/client";
import { hashPassword } from "@/utilities/bcrypt";
import { getJwtSecretKey } from "@/utilities/auth";
import { buildAuthCookie } from "@/utilities/auth/cookies";

type ClerkClaims = {
    username?: unknown;
    preferred_username?: unknown;
    email?: unknown;
    given_name?: unknown;
    family_name?: unknown;
};

const sanitizeUsername = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20);

const resolveUniqueUsername = async (candidate: string) => {
    const base = sanitizeUsername(candidate) || "human_user";

    for (let i = 0; i < 100; i += 1) {
        const suffix = i === 0 ? "" : `_${i}`;
        const maxBaseLength = 20 - suffix.length;
        const username = `${base.slice(0, maxBaseLength)}${suffix}`;
        const exists = await prisma.user.findUnique({ where: { username } });

        if (!exists) return username;
    }

    return `human_${Date.now().toString().slice(-8)}`.slice(0, 20);
};

const buildDisplayName = (claims: ClerkClaims) => {
    if (typeof claims.given_name === "string" && typeof claims.family_name === "string") {
        const fullName = `${claims.given_name} ${claims.family_name}`.trim();
        return fullName.slice(0, 50) || null;
    }

    if (typeof claims.given_name === "string") {
        return claims.given_name.slice(0, 50) || null;
    }

    return null;
};

const getUsernameCandidate = (userId: string, claims: ClerkClaims) => {
    if (typeof claims.username === "string") return claims.username;
    if (typeof claims.preferred_username === "string") return claims.preferred_username;
    if (typeof claims.email === "string") return claims.email.split("@")[0];
    return `human_${userId.slice(-8)}`;
};

export async function POST() {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
        return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    try {
        let user = await prisma.user.findUnique({
            where: {
                clerkId: userId,
            },
        });

        if (!user) {
            const claims = (sessionClaims || {}) as ClerkClaims;
            const usernameCandidate = getUsernameCandidate(userId, claims);
            const username = await resolveUniqueUsername(usernameCandidate);
            const generatedPassword = await hashPassword(`${userId}-${Date.now()}-${Math.random()}`);

            user = await prisma.user.create({
                data: {
                    clerkId: userId,
                    username,
                    password: generatedPassword,
                    name: buildDisplayName(claims),
                },
            });
        }

        const token = await new SignJWT({
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

        const response = NextResponse.json({ success: true });
        response.cookies.set(buildAuthCookie(token));
        return response;
    } catch {
        return NextResponse.json({ success: false, message: "Failed to sync Clerk session." }, { status: 500 });
    }
}
