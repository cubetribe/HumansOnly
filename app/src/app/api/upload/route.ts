import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

import { getAuthenticatedUser } from "@/utilities/auth/session";
import { prisma } from "@/prisma/client";
import { storeMediaBuffer, type ServerUploadType } from "@/utilities/storage/server";
import { InvalidUploadImageError, optimizeUploadImage } from "@/utilities/media/optimizeUploadImage";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif", "image/heic", "image/heif"];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB raw input
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const DAILY_UPLOAD_LIMIT = Number.parseInt(process.env.UPLOAD_MAX_FILES_PER_DAY || "40", 10);
const DAILY_BYTE_LIMIT = Number.parseInt(process.env.UPLOAD_MAX_BYTES_PER_DAY || `${250 * 1024 * 1024}`, 10);

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser();
        if (!authUser) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const rawType = formData.get("type");
        const type: ServerUploadType =
            typeof rawType === "string" && ["post", "profile", "header"].includes(rawType)
                ? (rawType as ServerUploadType)
                : "post";

        if (!file) {
            return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({
                success: false,
                error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`,
            }, { status: 400 });
        }

        if (file.size > MAX_SIZE) {
            return NextResponse.json({
                success: false,
                error: `File too large. Maximum ${MAX_SIZE / 1024 / 1024}MB allowed`,
            }, { status: 400 });
        }

        const since = new Date(Date.now() - ONE_DAY_MS);
        const usage = await prisma.mediaAsset.aggregate({
            where: {
                ownerId: authUser.id,
                createdAt: {
                    gte: since,
                },
            },
            _count: {
                _all: true,
            },
            _sum: {
                compressedSize: true,
            },
        });

        const uploadsInWindow = usage._count._all ?? 0;
        if (uploadsInWindow >= DAILY_UPLOAD_LIMIT) {
            return NextResponse.json({
                success: false,
                error: "Daily upload limit reached. Please try again later.",
            }, { status: 429 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const checksum = createHash("sha256").update(buffer).digest("hex");

        const duplicate = await prisma.mediaAsset.findFirst({
            where: {
                ownerId: authUser.id,
                checksum,
                uploadType: type,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        if (duplicate) {
            return NextResponse.json({
                success: true,
                path: duplicate.url,
                originalSize: duplicate.originalSize,
                compressedSize: duplicate.compressedSize,
                savings: `${Math.max(
                    0,
                    Math.round((1 - duplicate.compressedSize / Math.max(1, duplicate.originalSize)) * 100)
                )}%`,
                assetId: duplicate.id,
                provider: duplicate.provider,
                moderationStatus: duplicate.moderationStatus,
                reused: true,
            });
        }

        let optimized: Awaited<ReturnType<typeof optimizeUploadImage>>;
        try {
            optimized = await optimizeUploadImage({
                inputBuffer: buffer,
                uploadType: type,
            });
        } catch (error) {
            if (error instanceof InvalidUploadImageError) {
                return NextResponse.json(
                    {
                        success: false,
                        error: error.message,
                    },
                    { status: 400 }
                );
            }

            throw error;
        }

        const originalSize = file.size;
        const compressedSize = optimized.outputBytes;
        const uploadedBytesInWindow = usage._sum.compressedSize ?? 0;
        if (uploadedBytesInWindow + compressedSize > DAILY_BYTE_LIMIT) {
            return NextResponse.json({
                success: false,
                error: "Daily upload bandwidth limit reached. Please try again later.",
            }, { status: 429 });
        }

        const stored = await storeMediaBuffer({
            buffer: optimized.buffer,
            extension: optimized.extension,
            mimeType: optimized.mimeType,
            uploadType: type,
            userId: authUser.id,
        });

        const asset = await prisma.mediaAsset.create({
            data: {
                ownerId: authUser.id,
                provider: stored.provider,
                storageKey: stored.storageKey,
                url: stored.publicUrl,
                uploadType: type,
                mimeType: optimized.mimeType,
                originalSize,
                compressedSize,
                checksum,
                width: optimized.width,
                height: optimized.height,
            },
        });

        const savings = Math.max(0, Math.round((1 - compressedSize / originalSize) * 100));

        return NextResponse.json({
            success: true,
            path: stored.publicUrl,
            originalSize,
            compressedSize,
            savings: `${savings}%`,
            assetId: asset.id,
            provider: asset.provider,
            moderationStatus: asset.moderationStatus,
            outputFormat: optimized.mimeType,
            outputWidth: optimized.width,
            outputHeight: optimized.height,
            targetBytes: optimized.targetBytes,
            hardMaxBytes: optimized.hardMaxBytes,
            attempts: optimized.attempts,
            wasAnimated: optimized.wasAnimated,
            reused: false,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({
            success: false,
            error: "Upload failed. Please try again.",
        }, { status: 500 });
    }
}
