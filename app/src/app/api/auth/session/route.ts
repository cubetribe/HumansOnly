import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { verifyJwtToken } from "@/utilities/auth";

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        return NextResponse.json({ success: true, token: null });
    }

    try {
        const verifiedToken = await verifyJwtToken(token);
        return NextResponse.json({ success: true, token: verifiedToken ?? null });
    } catch {
        return NextResponse.json({ success: false, token: null });
    }
}
