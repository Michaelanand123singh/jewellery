import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// POST /api/upload - Upload image to Supabase Storage
export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

        // Require admin authentication
        const user = await requireAdmin(request);
        logger.request('POST', '/api/upload', ip, user.id);

        if (!supabaseAdmin) {
            return NextResponse.json(
                { success: false, error: 'Storage configuration missing. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' },
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

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, error: 'File size exceeds 5MB limit' },
                { status: 400 }
            );
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage
        const { data, error } = await supabaseAdmin.storage
            .from('products')
            .upload(fileName, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error('Supabase upload error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to upload image to storage' },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('products')
            .getPublicUrl(data.path);

        logger.info('Image uploaded successfully', {
            userId: user.id,
            path: data.path,
            size: file.size,
            type: file.type
        });

        return NextResponse.json({
            success: true,
            data: {
                url: publicUrl,
                path: data.path,
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

        console.error('Error uploading image:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to upload image' },
            { status: 500 }
        );
    }
}

// DELETE /api/upload - Delete image from Supabase Storage
export async function DELETE(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

        // Require admin authentication
        const user = await requireAdmin(request);
        logger.request('DELETE', '/api/upload', ip, user.id);

        if (!supabaseAdmin) {
            return NextResponse.json(
                { success: false, error: 'Storage configuration missing. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' },
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

        // Delete from Supabase Storage
        const { error } = await supabaseAdmin.storage
            .from('products')
            .remove([path]);

        if (error) {
            console.error('Supabase delete error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to delete image from storage' },
                { status: 500 }
            );
        }

        logger.info('Image deleted successfully', {
            userId: user.id,
            path
        });

        return NextResponse.json({
            success: true,
            message: 'Image deleted successfully',
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('Unauthorized')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Admin access required' },
                { status: 403 }
            );
        }

        console.error('Error deleting image:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete image' },
            { status: 500 }
        );
    }
}
