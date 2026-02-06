import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// MinIO configuration (S3-compatible)
function getMinIOConfig() {
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = parseInt(process.env.MINIO_PORT || '9000', 10);
    const useSSL = process.env.MINIO_USE_SSL === 'true';
    const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
    const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin123';
    const bucketName = process.env.MINIO_BUCKET_NAME || 'products';
    const publicUrl = process.env.MINIO_PUBLIC_URL || `http://${endpoint}:${port}`;

    return {
        endpoint: `${useSSL ? 'https' : 'http'}://${endpoint}:${port}`,
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
        region: 'us-east-1', // MinIO doesn't care about region, but SDK requires it
        forcePathStyle: true, // Required for MinIO
        bucketName,
        publicUrl,
    };
}

let s3Client: S3Client | null = null;

/**
 * Get or create S3 client instance (MinIO-compatible)
 */
export function getStorageClient(): S3Client | null {
    if (s3Client) {
        return s3Client;
    }

    try {
        const config = getMinIOConfig();
        s3Client = new S3Client({
            endpoint: config.endpoint,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
            region: config.region,
            forcePathStyle: config.forcePathStyle,
        });

        return s3Client;
    } catch (error) {
        console.error('Failed to create storage client:', error);
        return null;
    }
}

/**
 * Check if storage is configured
 */
export function isStorageConfigured(): boolean {
    const config = getMinIOConfig();
    return !!(config.accessKeyId && config.secretAccessKey && config.endpoint);
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(key: string): string {
    const config = getMinIOConfig();
    // Remove leading slash if present
    const cleanKey = key.startsWith('/') ? key.slice(1) : key;
    return `${config.publicUrl}/${config.bucketName}/${cleanKey}`;
}

/**
 * Convert MinIO URL to proxy URL for frontend access
 * This ensures images are accessible even if MinIO is not publicly accessible
 */
export function getProxyUrl(urlOrKey: string): string {
    // If it's already a proxy URL, return as is
    if (urlOrKey.includes('/api/images/')) {
        return urlOrKey;
    }

    // Extract the storage key from URL or use as-is if it's already a key
    let storageKey: string;
    
    if (urlOrKey.startsWith('http://') || urlOrKey.startsWith('https://')) {
        // Extract key from MinIO URL
        const extracted = extractStorageKey(urlOrKey);
        if (extracted) {
            storageKey = extracted;
        } else {
            // If extraction fails, try to parse the URL
            try {
                const url = new URL(urlOrKey);
                const pathParts = url.pathname.split('/').filter(Boolean);
                // Remove bucket name if present
                const config = getMinIOConfig();
                if (pathParts[0] === config.bucketName) {
                    pathParts.shift();
                }
                storageKey = pathParts.join('/');
            } catch {
                // If all else fails, return original URL
                return urlOrKey;
            }
        }
    } else {
        // It's already a storage key
        storageKey = urlOrKey.startsWith('/') ? urlOrKey.slice(1) : urlOrKey;
    }

    // Return proxy URL
    return `/api/images/${storageKey}`;
}

/**
 * Extract storage key from URL
 */
export function extractStorageKey(url: string): string | null {
    try {
        const config = getMinIOConfig();
        const publicUrl = config.publicUrl;
        const bucketName = config.bucketName;

        // Try to match: http://host:port/bucket/key
        const pattern1 = new RegExp(`${publicUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/${bucketName}/(.+)$`);
        const match1 = url.match(pattern1);
        if (match1) {
            return match1[1];
        }

        // Try to match: http://host:port/bucket/key (without trailing slash)
        const pattern2 = new RegExp(`${publicUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/${bucketName}/(.+)$`);
        const match2 = url.match(pattern2);
        if (match2) {
            return match2[1];
        }

        // If it's already a key (no URL), return as is
        if (!url.includes('http://') && !url.includes('https://')) {
            return url;
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Storage service for file operations
 */
export class StorageService {
    private client: S3Client | null;
    private config: ReturnType<typeof getMinIOConfig>;

    constructor() {
        this.client = getStorageClient();
        this.config = getMinIOConfig();
    }

    /**
     * Upload a file to storage
     */
    async uploadFile(
        file: File | Buffer,
        key: string,
        contentType?: string
    ): Promise<{ url: string; key: string } | null> {
        if (!this.client) {
            console.error('Storage client not initialized');
            return null;
        }

        try {
            // Convert File to Buffer if needed
            let buffer: Buffer;
            if (file instanceof File) {
                const arrayBuffer = await file.arrayBuffer();
                buffer = Buffer.from(arrayBuffer);
                contentType = contentType || file.type;
            } else {
                buffer = file;
            }

            // Remove leading slash from key
            const cleanKey = key.startsWith('/') ? key.slice(1) : key;

            const command = new PutObjectCommand({
                Bucket: this.config.bucketName,
                Key: cleanKey,
                Body: buffer,
                ContentType: contentType || 'application/octet-stream',
            });

            await this.client.send(command);

            const url = getPublicUrl(cleanKey);

            return {
                url,
                key: cleanKey,
            };
        } catch (error) {
            console.error('Storage upload error:', error);
            return null;
        }
    }

    /**
     * Delete a file from storage
     */
    async deleteFile(key: string): Promise<boolean> {
        if (!this.client) {
            console.error('Storage client not initialized');
            return false;
        }

        try {
            // Remove leading slash from key
            const cleanKey = key.startsWith('/') ? key.slice(1) : key;

            const command = new DeleteObjectCommand({
                Bucket: this.config.bucketName,
                Key: cleanKey,
            });

            await this.client.send(command);
            return true;
        } catch (error) {
            console.error('Storage delete error:', error);
            return false;
        }
    }

    /**
     * Get a presigned URL for temporary access (optional, for private files)
     */
    async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string | null> {
        if (!this.client) {
            return null;
        }

        try {
            const cleanKey = key.startsWith('/') ? key.slice(1) : key;
            const command = new GetObjectCommand({
                Bucket: this.config.bucketName,
                Key: cleanKey,
            });

            const url = await getSignedUrl(this.client, command, { expiresIn });
            return url;
        } catch (error) {
            console.error('Storage presigned URL error:', error);
            return null;
        }
    }

    /**
     * Check if file exists
     */
    async fileExists(key: string): Promise<boolean> {
        if (!this.client) {
            return false;
        }

        try {
            const cleanKey = key.startsWith('/') ? key.slice(1) : key;
            const command = new GetObjectCommand({
                Bucket: this.config.bucketName,
                Key: cleanKey,
            });

            await this.client.send(command);
            return true;
        } catch (error: any) {
            if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
                return false;
            }
            console.error('Storage file exists check error:', error);
            return false;
        }
    }
}

// Export singleton instance
export const storage = new StorageService();

// Export helper functions for backward compatibility
export async function uploadImage(
    file: File,
    bucket: string = 'products',
    folder: string = 'images'
): Promise<{ url: string; path: string } | null> {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const result = await storage.uploadFile(file, fileName, file.type);
    if (!result) {
        return null;
    }

    return {
        url: result.url,
        path: result.key,
    };
}

export async function deleteImage(
    path: string,
    bucket: string = 'products'
): Promise<boolean> {
    return await storage.deleteFile(path);
}

