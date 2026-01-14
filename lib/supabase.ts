import { createClient } from '@supabase/supabase-js';

// Lazy load env to avoid validation errors
function getEnv() {
    try {
        const { env } = require('./env');
        return env;
    } catch {
        return {
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        };
    }
}

const env = getEnv();

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

if (!isSupabaseConfigured) {
    if (typeof window === 'undefined') {
        console.warn('Supabase credentials missing. Image upload will not work.');
    }
}

// Client-side Supabase client (for browser)
export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Server-side Supabase client with service role (for API routes)
export const supabaseAdmin = (isSupabaseConfigured && supabaseServiceRoleKey)
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

// Helper function to upload image to Supabase Storage
export async function uploadImage(
    file: File,
    bucket: string = 'products',
    folder: string = 'images'
): Promise<{ url: string; path: string } | null> {
    if (!supabase) {
        console.error('Supabase client not initialized');
        return null;
    }

    try {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload file
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error('Upload error:', error);
            return null;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return {
            url: publicUrl,
            path: data.path,
        };
    } catch (error) {
        console.error('Upload error:', error);
        return null;
    }
}

// Helper function to delete image from Supabase Storage
export async function deleteImage(
    path: string,
    bucket: string = 'products'
): Promise<boolean> {
    if (!supabase) {
        console.error('Supabase client not initialized');
        return false;
    }

    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) {
            console.error('Delete error:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Delete error:', error);
        return false;
    }
}

// Helper function to extract Supabase storage path from URL
export function extractStoragePath(url: string): string | null {
    try {
        // Example URL: https://xxx.supabase.co/storage/v1/object/public/products/images/123.jpg
        const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}
