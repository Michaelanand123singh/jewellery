# Supabase Image Upload Setup Guide

## Overview

This guide explains how to set up Supabase Storage for product image uploads in the admin panel.

## Prerequisites

- Active Supabase project
- Admin access to Supabase dashboard

## Step 1: Create Storage Bucket

1. **Login to Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to Storage**
   - Click on "Storage" in the left sidebar
   - Click "Create a new bucket"

3. **Create Products Bucket**
   - **Name:** `products`
   - **Public bucket:** ✅ Enable (so images are publicly accessible)
   - Click "Create bucket"

## Step 2: Configure Bucket Policies

1. **Set Up Storage Policies**
   - Click on the `products` bucket
   - Go to "Policies" tab
   - Click "New Policy"

2. **Create Upload Policy (for authenticated users)**
   ```sql
   CREATE POLICY "Allow authenticated uploads"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'products');
   ```

3. **Create Public Read Policy**
   ```sql
   CREATE POLICY "Public read access"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'products');
   ```

4. **Create Delete Policy (for authenticated users)**
   ```sql
   CREATE POLICY "Allow authenticated deletes"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'products');
   ```

## Step 3: Get Supabase Credentials

1. **Get Project URL**
   - Go to Project Settings > API
   - Copy the **Project URL**
   - Example: `https://xxxxxxxxxxxxx.supabase.co`

2. **Get Anon Key**
   - In the same API settings page
   - Copy the **anon/public** key
   - This is safe to use in the browser

3. **Get Service Role Key**
   - Copy the **service_role** key
   - ⚠️ **IMPORTANT:** Keep this secret! Never expose in client-side code

## Step 4: Update Environment Variables

Add these to your `.env` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

### Getting Your Actual Values:

Based on your existing database URL, your Supabase project ID is: `ldzlhefoqgqtmvanoyya`

So your URL should be:
```env
NEXT_PUBLIC_SUPABASE_URL="https://ldzlhefoqgqtmvanoyya.supabase.co"
```

To get your keys:
1. Go to: https://supabase.com/dashboard/project/ldzlhefoqgqtmvanoyya/settings/api
2. Copy the **anon public** key
3. Copy the **service_role** key

## Step 5: Folder Structure

The upload system creates the following folder structure in your bucket:

```
products/
├── main/          # Main product images
│   ├── 1705234567890-abc123.jpg
│   ├── 1705234567891-def456.png
│   └── ...
└── additional/    # Additional product images
    ├── 1705234567892-ghi789.jpg
    ├── 1705234567893-jkl012.webp
    └── ...
```

## Step 6: Test the Upload

1. **Restart Development Server**
   ```bash
   npm run dev
   ```

2. **Login as Admin**
   - Go to `http://localhost:3001/login`
   - Email: `admin@jewellery.com`
   - Password: Your admin password

3. **Test Upload**
   - Navigate to Admin Dashboard
   - Click "Add Product"
   - Click "Upload Image" button
   - Select an image file
   - Verify it uploads successfully

## Features

### Main Image Upload
- ✅ Click "Upload Image" or paste URL
- ✅ Automatic upload to Supabase Storage
- ✅ Real-time preview
- ✅ File validation (type & size)
- ✅ Progress indicator

### Additional Images Upload
- ✅ Upload up to 5 additional images
- ✅ Multiple file selection
- ✅ Grid preview with thumbnails
- ✅ Remove individual images
- ✅ Drag & drop support (browser native)

### Validation
- ✅ File type: JPEG, PNG, WebP
- ✅ Max size: 5MB per image
- ✅ Max additional images: 5

## API Endpoints

### POST /api/upload
Upload an image to Supabase Storage

**Request:**
```typescript
FormData {
  file: File,
  folder: string (optional, default: 'images')
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://xxx.supabase.co/storage/v1/object/public/products/main/123.jpg",
    "path": "main/123.jpg",
    "name": "image.jpg",
    "size": 123456,
    "type": "image/jpeg"
  }
}
```

### DELETE /api/upload?path=xxx
Delete an image from Supabase Storage

**Query Parameters:**
- `path`: Storage path of the image to delete

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

## Troubleshooting

### Issue: "Failed to upload image to storage"

**Possible Causes:**
1. Bucket doesn't exist
2. Bucket is not public
3. Missing storage policies
4. Invalid credentials

**Solution:**
- Verify bucket name is exactly `products`
- Check bucket is marked as public
- Verify storage policies are created
- Check environment variables are correct

### Issue: "Unauthorized: Admin access required"

**Cause:** Not logged in as admin

**Solution:**
- Login with admin credentials
- Verify user role is "ADMIN" in database

### Issue: Images not displaying

**Possible Causes:**
1. Bucket is not public
2. CORS not configured
3. Invalid URL

**Solution:**
1. Make bucket public in Supabase dashboard
2. Add CORS policy (usually automatic for public buckets)
3. Verify URL format is correct

### Issue: "File size exceeds 5MB limit"

**Cause:** Image file is too large

**Solution:**
- Compress image before uploading
- Use online tools like TinyPNG or ImageOptim
- Recommended size: 800x800px, < 500KB

## Security Best Practices

1. **Never expose Service Role Key**
   - Only use in server-side code (API routes)
   - Never send to client

2. **Use Row Level Security (RLS)**
   - Enable RLS on storage.objects table
   - Create specific policies for different operations

3. **Validate File Types**
   - Server-side validation (already implemented)
   - Check file signatures, not just extensions

4. **Limit File Sizes**
   - Current limit: 5MB (already implemented)
   - Adjust based on your needs

5. **Rate Limiting**
   - Already implemented via middleware
   - 100 requests per minute per IP

## Storage Costs

Supabase Free Tier includes:
- **Storage:** 1 GB
- **Bandwidth:** 2 GB/month
- **File uploads:** Unlimited

For production:
- Monitor usage in Supabase dashboard
- Upgrade plan if needed
- Consider image optimization

## Image Optimization Tips

1. **Compress Images**
   - Use WebP format (better compression)
   - Target: < 500KB per image

2. **Resize Images**
   - Recommended: 800x800px for main images
   - Thumbnails: 200x200px

3. **Use CDN**
   - Supabase Storage includes CDN
   - Images are automatically cached

4. **Lazy Loading**
   - Already implemented in product cards
   - Improves page load speed

## Migration from URL-based to Upload

If you have existing products with external URLs:

1. **Keep existing URLs working**
   - The system supports both uploads and URLs
   - No need to migrate immediately

2. **Gradual Migration**
   - Edit products one by one
   - Upload new images
   - Old URLs will be replaced

3. **Bulk Migration** (optional)
   - Create a script to download and re-upload
   - Update database with new URLs

## Next Steps

1. ✅ Set up Supabase Storage bucket
2. ✅ Configure environment variables
3. ✅ Test image upload
4. ✅ Add your first product with images
5. 🔄 Monitor storage usage
6. 🔄 Optimize images for production

## Support

For issues:
1. Check Supabase dashboard for errors
2. Verify environment variables
3. Check browser console for errors
4. Review API logs in Supabase

## Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage Policies Guide](https://supabase.com/docs/guides/storage/security/access-control)
- [Image Optimization Guide](https://web.dev/fast/#optimize-your-images)
