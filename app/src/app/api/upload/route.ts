import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import sharp from "sharp";
import { cookies } from "next/headers";

import { verifyJwtToken } from "@/utilities/auth";

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB raw input
const MAX_OUTPUT_WIDTH = 1920;
const MAX_OUTPUT_HEIGHT = 1080;
const JPEG_QUALITY = 85;

export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get("token")?.value;
        const verifiedToken = token ? await verifyJwtToken(token) : null;

        if (!verifiedToken) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const rawType = formData.get('type');
        const type = typeof rawType === "string" && ["post", "profile", "header"].includes(rawType) ? rawType : "post";

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({
                success: false,
                error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`
            }, { status: 400 });
        }

        if (file.size > MAX_SIZE) {
            return NextResponse.json({
                success: false,
                error: `File too large. Maximum ${MAX_SIZE / 1024 / 1024}MB allowed`
            }, { status: 400 });
        }

        const uploadDir = join(process.cwd(), 'public', 'uploads');
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Determine dimensions based on type
        let maxWidth = MAX_OUTPUT_WIDTH;
        let maxHeight = MAX_OUTPUT_HEIGHT;

        if (type === 'profile') {
            maxWidth = 400;
            maxHeight = 400;
        } else if (type === 'header') {
            maxWidth = 1500;
            maxHeight = 500;
        }

        // Process image with Sharp
        let processedBuffer: Buffer;

        if (file.type === 'image/gif') {
            // GIFs: only resize, keep animation
            processedBuffer = await sharp(buffer, { animated: true })
                .resize(maxWidth, maxHeight, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .toBuffer();
        } else {
            // Other images: resize and convert to JPEG for compression
            processedBuffer = await sharp(buffer)
                .resize(maxWidth, maxHeight, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: JPEG_QUALITY, progressive: true })
                .toBuffer();
        }

        const ext = file.type === 'image/gif' ? 'gif' : 'jpg';
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const filepath = join(uploadDir, filename);

        await writeFile(filepath, processedBuffer);

        const originalSize = file.size;
        const compressedSize = processedBuffer.length;
        const savings = Math.max(0, Math.round((1 - compressedSize / originalSize) * 100));

        return NextResponse.json({
            success: true,
            path: `/uploads/${filename}`,
            originalSize,
            compressedSize,
            savings: `${savings}%`
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({
            success: false,
            error: 'Upload failed. Please try again.'
        }, { status: 500 });
    }
}
