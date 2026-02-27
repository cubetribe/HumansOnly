import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createHash } from "crypto";

import { getAuthenticatedUser } from "@/utilities/auth/session";
import { prisma } from "@/prisma/client";
import { storeMediaBuffer, type ServerUploadType } from "@/utilities/storage/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif", "image/heic", "image/heif"];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB raw input
const MAX_OUTPUT_WIDTH = 1920;
const MAX_OUTPUT_HEIGHT = 1080;
const JPEG_QUALITY = 85;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_INPUT_PIXELS = 40_000_000; // 40MP safety cap against decompression bombs

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

        let sourceMetadata: sharp.Metadata;
        try {
            sourceMetadata = await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    error: "The uploaded file is not a valid or supported image.",
                },
                { status: 400 }
            );
        }

        if (!sourceMetadata.width || !sourceMetadata.height) {
            return NextResponse.json({ success: false, error: "Unable to read image dimensions." }, { status: 400 });
        }

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

        // Determine dimensions based on type
        let maxWidth = MAX_OUTPUT_WIDTH;
        let maxHeight = MAX_OUTPUT_HEIGHT;

        if (type === "profile") {
            maxWidth = 400;
            maxHeight = 400;
        } else if (type === "header") {
            maxWidth = 1500;
            maxHeight = 500;
        }

        // Process image with Sharp
        let processedBuffer: Buffer;
        let outputMimeType = "image/jpeg";

        if (file.type === "image/gif") {
            // GIFs: only resize, keep animation
            processedBuffer = await sharp(buffer, { animated: true })
                .resize(maxWidth, maxHeight, {
                    fit: "inside",
                    withoutEnlargement: true,
                })
                .toBuffer();
            outputMimeType = "image/gif";
        } else {
            // Other images: resize and convert to JPEG for compression
            processedBuffer = await sharp(buffer)
                .resize(maxWidth, maxHeight, {
                    fit: "inside",
                    withoutEnlargement: true,
                })
                .jpeg({ quality: JPEG_QUALITY, progressive: true })
                .toBuffer();
        }

        const ext = file.type === "image/gif" ? "gif" : "jpg";

        const originalSize = file.size;
        const compressedSize = processedBuffer.length;
        const uploadedBytesInWindow = usage._sum.compressedSize ?? 0;
        if (uploadedBytesInWindow + compressedSize > DAILY_BYTE_LIMIT) {
            return NextResponse.json({
                success: false,
                error: "Daily upload bandwidth limit reached. Please try again later.",
            }, { status: 429 });
        }

        const stored = await storeMediaBuffer({
            buffer: processedBuffer,
            extension: ext,
            mimeType: outputMimeType,
            uploadType: type,
            userId: authUser.id,
        });

        const metadata = await sharp(processedBuffer, {
            animated: file.type === "image/gif",
        }).metadata();

        const asset = await prisma.mediaAsset.create({
            data: {
                ownerId: authUser.id,
                provider: stored.provider,
                storageKey: stored.storageKey,
                url: stored.publicUrl,
                uploadType: type,
                mimeType: outputMimeType,
                originalSize,
                compressedSize,
                checksum,
                width: metadata.width ?? null,
                height: metadata.height ?? null,
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
