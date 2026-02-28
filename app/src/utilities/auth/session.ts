import { auth } from "@clerk/nextjs/server";
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/prisma/client";
import { verifyJwtToken } from "@/utilities/auth";
import { hashPassword } from "@/utilities/bcrypt";
import { UserRole, isUserRole } from "@/types/Role";

type ClerkClaims = {
    username?: unknown;
    preferred_username?: unknown;
    email?: unknown;
    given_name?: unknown;
    family_name?: unknown;
};

const authenticatedUserSelect = {
    id: true,
    clerkId: true,
    username: true,
    name: true,
    description: true,
    location: true,
    website: true,
    isVerifiedHuman: true,
    role: true,
    createdAt: true,
    photoUrl: true,
    headerUrl: true,
} satisfies Prisma.UserSelect;

type AuthenticatedUserRecord = Prisma.UserGetPayload<{ select: typeof authenticatedUserSelect }>;

export type AuthenticatedUser = AuthenticatedUserRecord & {
    authSource: "clerk" | "legacy";
};

export const isAdmin = (user: Pick<AuthenticatedUser, "role"> | null | undefined) => user?.role === "admin";

export const isModerator = (user: Pick<AuthenticatedUser, "role"> | null | undefined) =>
    user?.role === "moderator" || user?.role === "admin";

export const normalizeUserRole = (value: unknown): UserRole => (isUserRole(value) ? value : "user");

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

export const getOrCreateUserByClerkId = async (userId: string, claims: ClerkClaims = {}) => {
    const existing = await prisma.user.findUnique({
        where: {
            clerkId: userId,
        },
        select: authenticatedUserSelect,
    });

    if (existing) return existing;

    const usernameCandidate = getUsernameCandidate(userId, claims);
    const username = await resolveUniqueUsername(usernameCandidate);
    const generatedPassword = await hashPassword(`${userId}-${Date.now()}-${Math.random()}`);

    return prisma.user.create({
        data: {
            clerkId: userId,
            username,
            password: generatedPassword,
            name: buildDisplayName(claims),
        },
        select: authenticatedUserSelect,
    });
};

const getLegacyCookieUser = async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return null;

    const verifiedToken = await verifyJwtToken(token);
    const tokenUserId = typeof verifiedToken?.id === "string" ? verifiedToken.id : null;

    if (!tokenUserId) return null;

    return prisma.user.findUnique({
        where: {
            id: tokenUserId,
        },
        select: authenticatedUserSelect,
    });
};

export const getAuthenticatedUser = async (): Promise<AuthenticatedUser | null> => {
    try {
        const { userId, sessionClaims } = await auth();

        if (userId) {
            const user = await getOrCreateUserByClerkId(userId, (sessionClaims || {}) as ClerkClaims);
            return {
                ...user,
                authSource: "clerk",
            };
        }
    } catch {
        // Gracefully continue with legacy cookie fallback.
    }

    const legacyUser = await getLegacyCookieUser();
    if (!legacyUser) return null;

    return {
        ...legacyUser,
        authSource: "legacy",
    };
};

export const unauthorizedResponse = (message = "You are not authorized to perform this action.") =>
    NextResponse.json({ success: false, message }, { status: 401 });
