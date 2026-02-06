/**
 * Image Proxy Route - Serve images from MinIO storage through Next.js
 * This ensures images are accessible even if MinIO is not publicly accessible
 * 
 * GET /api/images/[...path] - Proxy image requests to MinIO
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStorageClient, extractStorageKey } from '@/lib/storage';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    const path = pathArray.join('/');
    
    const client = getStorageClient();
    if (!client) {
      logger.error('Image proxy: Storage client not initialized');
      return NextResponse.json(
        { success: false, error: 'Storage not configured' },
        { status: 500 }
      );
    }

    // Get bucket name from config
    const bucketName = process.env.MINIO_BUCKET_NAME || 'products';
    
    // Extract the storage key from the path
    // Path format: blogs/1234567890-abc123.jpg
    const storageKey = path;

    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: storageKey,
      });

      const response = await client.send(command);
      
      if (!response.Body) {
        return NextResponse.json(
          { success: false, error: 'Image not found' },
          { status: 404 }
        );
      }

      // Convert stream to buffer
      // AWS SDK v3 returns a Readable stream (Node.js)
      let buffer: Buffer | null = null;
      const chunks: Buffer[] = [];
      
      try {
        // Handle Node.js Readable stream
        if (response.Body && typeof (response.Body as any)[Symbol.asyncIterator] === 'function') {
          for await (const chunk of response.Body as any) {
            chunks.push(Buffer.from(chunk));
          }
          buffer = Buffer.concat(chunks);
        } else if (response.Body && typeof (response.Body as any).getReader === 'function') {
          // Handle Web ReadableStream
          const reader = (response.Body as ReadableStream).getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) chunks.push(Buffer.from(value));
          }
          buffer = Buffer.concat(chunks);
        } else {
          // Fallback: try to read as buffer directly
          const body = response.Body as any;
          if (Buffer.isBuffer(body)) {
            buffer = body;
          } else {
            throw new Error('Unknown stream type');
          }
        }
        
        if (!buffer) {
          throw new Error('Failed to read image data');
        }
      } catch (streamError: any) {
        logger.error('Image proxy: Error reading stream', {
          path: storageKey,
          error: streamError.message,
        });
        return NextResponse.json(
          { success: false, error: 'Failed to read image data' },
          { status: 500 }
        );
      }
      
      // Determine content type
      const contentType = response.ContentType || 'image/jpeg';
      
      // Set appropriate cache headers
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      headers.set('Content-Length', buffer.length.toString());

      return new NextResponse(buffer as any, {
        status: 200,
        headers,
      });
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        logger.warn('Image proxy: Image not found', { path: storageKey });
        return NextResponse.json(
          { success: false, error: 'Image not found' },
          { status: 404 }
        );
      }
      
      logger.error('Image proxy: Error fetching image', {
        path: storageKey,
        error: error.message,
      });
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch image' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Image proxy: Unexpected error', { error: error.message });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

