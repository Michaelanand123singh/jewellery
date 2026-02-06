# Storage and Cache Setup Guide

## Overview

This application uses **MinIO** for file storage and **Redis** for caching. Supabase has been completely removed.

## Services

### MinIO - Object Storage
- **Purpose**: Store all files (images, documents, etc.)
- **Location**: Docker container or local installation
- **Default Bucket**: `products`
- **Access**: S3-compatible API

### Redis - Caching
- **Purpose**: Cache data, rate limiting, session storage
- **Location**: Docker container or local installation
- **Features**: Automatic fallback to in-memory if Redis unavailable

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Redis Configuration
REDIS_URL="redis://:redis_password@localhost:6381"
REDIS_HOST="localhost"
REDIS_PORT="6381"
REDIS_PASSWORD="redis_password"

# MinIO Configuration
MINIO_ENDPOINT="localhost"
MINIO_PORT="9002"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin123"
MINIO_BUCKET_NAME="products"
MINIO_PUBLIC_URL="http://localhost:9002"
MINIO_CONSOLE_URL="http://localhost:9003"
```

### Docker Setup

If using Docker (recommended):

```bash
# Start infrastructure services
docker-compose -f docker-compose.infrastructure.yml up -d

# Setup MinIO bucket (run once)
docker-compose -f docker-compose.infrastructure.yml --profile setup up minio-setup
```

## File Storage (MinIO)

### Upload Files

```typescript
import { storage } from '@/lib/storage';

// Upload a file
const result = await storage.uploadFile(
    file,           // File or Buffer
    'images/test.jpg',  // Key/path
    'image/jpeg'    // Content type (optional)
);

if (result) {
    console.log('URL:', result.url);
    console.log('Key:', result.key);
}
```

### Delete Files

```typescript
import { storage } from '@/lib/storage';

// Delete a file
const deleted = await storage.deleteFile('images/test.jpg');
```

### Get Public URL

```typescript
import { getPublicUrl } from '@/lib/storage';

const url = getPublicUrl('images/test.jpg');
// Returns: http://localhost:9002/products/images/test.jpg
```

### Extract Storage Key from URL

```typescript
import { extractStorageKey } from '@/lib/storage';

const key = extractStorageKey('http://localhost:9002/products/images/test.jpg');
// Returns: 'images/test.jpg'
```

## Caching (Redis)

### Basic Cache Operations

```typescript
import { cache } from '@/lib/redis';

// Set cache with TTL (60 seconds)
await cache.set('user:123', { name: 'John' }, 60);

// Get from cache
const user = await cache.get<{ name: string }>('user:123');

// Delete from cache
await cache.delete('user:123');

// Check if key exists
const exists = await cache.exists('user:123');

// Increment counter
const count = await cache.increment('views:123', 1);

// Delete all keys matching pattern
await cache.deletePattern('user:*');
```

### Cache Patterns

#### Product Caching
```typescript
// Cache product for 5 minutes
const cacheKey = `product:${productId}`;
let product = await cache.get<Product>(cacheKey);

if (!product) {
    product = await fetchProductFromDB(productId);
    await cache.set(cacheKey, product, 300); // 5 minutes
}
```

#### API Response Caching
```typescript
// Cache API response
const cacheKey = `api:products:${category}`;
let products = await cache.get<Product[]>(cacheKey);

if (!products) {
    products = await fetchProducts(category);
    await cache.set(cacheKey, products, 60); // 1 minute
}
```

## API Endpoints

### POST /api/upload
Upload a file to MinIO storage.

**Request:**
- `file`: File to upload
- `folder`: Optional folder path (default: 'images')

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "http://localhost:9002/products/images/123.jpg",
    "path": "images/123.jpg",
    "name": "image.jpg",
    "size": 123456,
    "type": "image/jpeg"
  }
}
```

### DELETE /api/upload?path=xxx
Delete a file from MinIO storage.

**Query Parameters:**
- `path`: Storage path of the file to delete

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

## Rate Limiting

Rate limiting is automatically handled by middleware using Redis (with in-memory fallback).

- **Default**: 100 requests per minute per IP
- **Payment endpoints**: 10 requests per minute
- **Webhooks**: 30 requests per minute

## Migration from Supabase

### What Changed

1. **File Storage**: Supabase Storage → MinIO
2. **Caching**: In-memory → Redis (with fallback)
3. **Rate Limiting**: In-memory → Redis (with fallback)

### Code Changes

**Before (Supabase):**
```typescript
import { uploadImage, deleteImage } from '@/lib/supabase';
```

**After (MinIO):**
```typescript
import { storage } from '@/lib/storage';
// or
import { uploadImage, deleteImage } from '@/lib/storage';
```

The API remains compatible - `uploadImage` and `deleteImage` functions still work the same way.

## Troubleshooting

### MinIO Connection Issues

1. **Check if MinIO is running:**
   ```bash
   docker-compose -f docker-compose.infrastructure.yml ps minio
   ```

2. **Check MinIO health:**
   ```bash
   curl http://localhost:9002/minio/health/live
   ```

3. **Access MinIO Console:**
   - URL: http://localhost:9003
   - Username: minioadmin
   - Password: minioadmin123

### Redis Connection Issues

1. **Check if Redis is running:**
   ```bash
   docker-compose -f docker-compose.infrastructure.yml ps redis
   ```

2. **Test Redis connection:**
   ```bash
   docker-compose -f docker-compose.infrastructure.yml exec redis redis-cli -a redis_password PING
   ```

3. **Note**: If Redis is unavailable, the application will automatically fall back to in-memory caching and rate limiting.

### File Upload Errors

1. **Check environment variables:**
   - `MINIO_ENDPOINT`
   - `MINIO_ACCESS_KEY`
   - `MINIO_SECRET_KEY`
   - `MINIO_BUCKET_NAME`

2. **Verify bucket exists:**
   - Access MinIO Console
   - Check if `products` bucket exists
   - Verify bucket is public

3. **Check file size limits:**
   - Default: 10MB per file
   - Can be adjusted in `app/api/upload/route.ts`

## Best Practices

1. **File Naming**: Use unique filenames with timestamps
   ```typescript
   const fileName = `images/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
   ```

2. **Cache Keys**: Use consistent naming patterns
   ```typescript
   // Good
   `product:${id}`
   `user:${id}:profile`
   `api:products:${category}`
   
   // Bad
   `product${id}`
   `user_${id}`
   ```

3. **Cache TTL**: Set appropriate expiration times
   - Frequently changing data: 60 seconds
   - Moderately changing: 5 minutes
   - Rarely changing: 1 hour

4. **Error Handling**: Always check if storage/cache operations succeed
   ```typescript
   const result = await storage.uploadFile(file, key);
   if (!result) {
     // Handle error
   }
   ```

## Security Notes

1. **MinIO Credentials**: Change default credentials in production
2. **Redis Password**: Use strong passwords in production
3. **File Validation**: Always validate file types and sizes
4. **Access Control**: Admin-only uploads are enforced via API routes

## Support

For issues:
1. Check service logs: `docker-compose logs [service]`
2. Verify environment variables in `.env`
3. Check service health: `docker-compose ps`
4. Review application logs for detailed error messages

