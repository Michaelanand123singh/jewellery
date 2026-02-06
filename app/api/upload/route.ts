import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { storage, isStorageConfigured } from '@/lib/storage';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// POST /api/upload - Upload file to MinIO Storage
export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

        // Require admin authentication
        const user = await requireAdmin(request);
        logger.request('POST', '/api/upload', ip, user.id);

        if (!isStorageConfigured()) {
            const missing: string[] = [];
            
            if (!process.env.MINIO_ENDPOINT) missing.push('MINIO_ENDPOINT');
            if (!process.env.MINIO_ACCESS_KEY) missing.push('MINIO_ACCESS_KEY');
            if (!process.env.MINIO_SECRET_KEY) missing.push('MINIO_SECRET_KEY');
            if (!process.env.MINIO_BUCKET_NAME) missing.push('MINIO_BUCKET_NAME');
            
            const errorMessage = missing.length > 0
                ? `Missing required environment variables: ${missing.join(', ')}. Please check your .env file.`
                : 'Storage configuration missing. Please check your .env file.';
            
            logger.error('File upload failed: Storage not configured', {
                userId: user.id,
                missing,
            });
            
            return NextResponse.json(
                { success: false, error: errorMessage },
                { status: 500 }
            );
        }

        // Get form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = (formData.get('folder') as string) || 'images';

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type (support any file type, but log it)
        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        const isImage = allowedImageTypes.includes(file.type);
        
        // For non-image files, we still allow upload but with stricter validation
        if (!isImage && !file.type) {
            return NextResponse.json(
                { success: false, error: 'Invalid file type. File must have a valid MIME type.' },
                { status: 400 }
            );
        }

        // Validate file size (max 10MB for any file type)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` },
                { status: 400 }
            );
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop() || 'bin';
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to MinIO Storage
        const result = await storage.uploadFile(file, fileName, file.type);

        if (!result) {
            logger.error('File upload failed: Storage upload error', {
                userId: user.id,
                fileName: file.name,
                size: file.size,
                type: file.type,
            });
            
            return NextResponse.json(
                { success: false, error: 'Failed to upload file to storage' },
                { status: 500 }
            );
        }

        logger.info('File uploaded successfully', {
            userId: user.id,
            path: result.key,
            url: result.url,
            size: file.size,
            type: file.type
        });

        return NextResponse.json({
            success: true,
            data: {
                url: result.url,
                path: result.key,
                name: file.name,
                size: file.size,
                type: file.type,
            },
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('Unauthorized')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Admin access required' },
                { status: 403 }
            );
        }

        console.error('Error uploading file:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}

// DELETE /api/upload - Delete file from MinIO Storage
export async function DELETE(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

        // Require admin authentication
        const user = await requireAdmin(request);
        logger.request('DELETE', '/api/upload', ip, user.id);

        if (!isStorageConfigured()) {
            const errorMessage = 'Storage configuration missing. Please check your .env file.';
            
            logger.error('File delete failed: Storage not configured', {
                userId: user.id,
            });
            
            return NextResponse.json(
                { success: false, error: errorMessage },
                { status: 500 }
            );
        }

        const { searchParams } = new URL(request.url);
        const path = searchParams.get('path');

        if (!path) {
            return NextResponse.json(
                { success: false, error: 'No path provided' },
                { status: 400 }
            );
        }

        // Delete from MinIO Storage
        const deleted = await storage.deleteFile(path);

        if (!deleted) {
            logger.error('File delete failed: Storage delete error', {
                userId: user.id,
                path,
            });
            
            return NextResponse.json(
                { success: false, error: 'Failed to delete file from storage' },
                { status: 500 }
            );
        }

        logger.info('File deleted successfully', {
            userId: user.id,
            path
        });

        return NextResponse.json({
            success: true,
            message: 'File deleted successfully',
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('Unauthorized')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Admin access required' },
                { status: 403 }
            );
        }

        console.error('Error deleting file:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete file' },
            { status: 500 }
        );
    }
}
