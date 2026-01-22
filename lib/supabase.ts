import { createClient } from '@supabase/supabase-js';

// Get Supabase environment variables directly from process.env
// These are not in lib/env.ts schema, so we read them directly
function getSupabaseEnv() {
    // In Next.js, environment variables are loaded from .env files automatically
    // NEXT_PUBLIC_* variables are available on both client and server
    // Other variables are only available on the server
    return {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    };
}

const env = getSupabaseEnv();

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';

const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;
const isAdminConfigured = isSupabaseConfigured && supabaseServiceRoleKey;

// Log warnings for missing configuration (server-side only)
if (typeof window === 'undefined') {
    if (!isSupabaseConfigured) {
        console.warn('⚠️  Supabase client credentials missing. Image upload will not work.');
        console.warn('   Missing: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    } else if (!isAdminConfigured) {
        console.warn('⚠️  Supabase admin credentials missing. Admin image upload will not work.');
        console.warn('   Missing: SUPABASE_SERVICE_ROLE_KEY');
        console.warn('   Note: Service role key is required for server-side uploads.');
    }
}

// Client-side Supabase client (for browser)
export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Server-side Supabase client with service role (for API routes)
export const supabaseAdmin = isAdminConfigured
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

// Helper to get configuration status
export function getSupabaseConfigStatus() {
    return {
        clientConfigured: isSupabaseConfigured,
        adminConfigured: isAdminConfigured,
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        hasServiceRoleKey: !!supabaseServiceRoleKey,
    };
}

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
