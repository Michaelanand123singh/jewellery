# Image Upload Feature - Quick Reference

## ✅ What's Been Implemented

### 1. **Supabase Integration**
- ✅ Supabase client configuration (`lib/supabase.ts`)
- ✅ Image upload helper functions
- ✅ Image delete helper functions
- ✅ Path extraction utilities

### 2. **API Endpoints**
- ✅ `POST /api/upload` - Upload images to Supabase Storage
- ✅ `DELETE /api/upload` - Delete images from Supabase Storage
- ✅ File validation (type, size)
- ✅ Admin authentication required
- ✅ Error handling and logging

### 3. **Admin Panel Features**
- ✅ Main image upload with preview
- ✅ Additional images upload (up to 5)
- ✅ Drag & drop file selection
- ✅ Real-time image previews
- ✅ Remove individual images
- ✅ Upload progress indicators
- ✅ Fallback to URL input
- ✅ File validation feedback

### 4. **Security**
- ✅ Admin-only access
- ✅ File type validation (JPEG, PNG, WebP)
- ✅ File size limits (5MB max)
- ✅ Server-side validation
- ✅ Secure credential handling

## 🚀 Quick Start

### Step 1: Install Dependencies
```bash
npm install @supabase/supabase-js
```
✅ **Already completed**

### Step 2: Set Up Supabase Storage

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/ldzlhefoqgqtmvanoyya)
2. Navigate to **Storage** → **Create new bucket**
3. Create bucket named: `products`
4. Enable **Public bucket**
5. Set up storage policies (see SUPABASE_SETUP.md)

### Step 3: Get Supabase Credentials

1. Go to: https://supabase.com/dashboard/project/ldzlhefoqgqtmvanoyya/settings/api
2. Copy these values:
   - **Project URL**: `https://ldzlhefoqgqtmvanoyya.supabase.co`
   - **anon public key**: Copy from dashboard
   - **service_role key**: Copy from dashboard

### Step 4: Update .env File

Add to your `.env` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://ldzlhefoqgqtmvanoyya.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="paste-your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="paste-your-service-role-key-here"
```

### Step 5: Restart Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 6: Test Upload

1. Login as admin: http://localhost:3001/login
2. Go to Admin Dashboard
3. Click "Add Product"
4. Click "Upload Image" button
5. Select an image file
6. Verify upload success!

## 📁 Files Created/Modified

### New Files:
1. `lib/supabase.ts` - Supabase client & helpers
2. `app/api/upload/route.ts` - Upload API endpoint
3. `SUPABASE_SETUP.md` - Detailed setup guide
4. `IMAGE_UPLOAD_GUIDE.md` - This file

### Modified Files:
1. `app/admin/page.tsx` - Added upload UI & functionality
2. `env.example` - Added Supabase variables
3. `package.json` - Added @supabase/supabase-js dependency

## 🎨 How to Use in Admin Panel

### Upload Main Image:
1. Click "Upload Image" button
2. Select image file (or paste URL)
3. Preview appears automatically
4. Image URL saved to form

### Upload Additional Images:
1. Click "Add More Images" button
2. Select multiple images (Ctrl+Click or Cmd+Click)
3. Thumbnails appear in grid
4. Click X to remove any image
5. Max 5 additional images

### Supported Formats:
- ✅ JPEG (.jpg, .jpeg)
- ✅ PNG (.png)
- ✅ WebP (.webp)

### File Limits:
- Max size: 5MB per image
- Max additional images: 5

## 🔧 Configuration

### Change Upload Limits:

Edit `app/api/upload/route.ts`:

```typescript
// Change max file size (currently 5MB)
const maxSize = 5 * 1024 * 1024; // Change this value

// Change allowed file types
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
```

### Change Bucket Name:

If you want to use a different bucket:

1. Update `app/api/upload/route.ts`:
```typescript
const { data, error } = await supabaseAdmin.storage
  .from('your-bucket-name') // Change here
  .upload(fileName, buffer, {
```

2. Update `lib/supabase.ts`:
```typescript
export async function uploadImage(
  file: File,
  bucket: string = 'your-bucket-name', // Change here
```

## 📊 Storage Structure

```
products/                    (Supabase Storage Bucket)
├── main/                    (Main product images)
│   ├── 1705234567890-abc123.jpg
│   ├── 1705234567891-def456.png
│   └── ...
└── additional/              (Additional product images)
    ├── 1705234567892-ghi789.jpg
    ├── 1705234567893-jkl012.webp
    └── ...
```

## 🐛 Troubleshooting

### Error: "Failed to upload image to storage"

**Check:**
1. ✅ Supabase bucket exists and is named `products`
2. ✅ Bucket is public
3. ✅ Storage policies are configured
4. ✅ Environment variables are set correctly
5. ✅ Logged in as admin

### Error: "Unauthorized: Admin access required"

**Solution:**
- Login with admin credentials
- Email: `admin@jewellery.com`
- Password: Check your `.env` file

### Images not displaying

**Check:**
1. ✅ Bucket is public in Supabase
2. ✅ URL format is correct
3. ✅ Image actually uploaded (check Supabase Storage)

### Upload button disabled

**Possible reasons:**
- Already uploading (wait for current upload)
- Reached max images (5 additional images)
- Not logged in as admin

## 📝 Environment Variables Checklist

Make sure these are in your `.env` file:

```env
# Database (already configured)
✅ DATABASE_URL
✅ DIRECT_URL

# Authentication (already configured)
✅ JWT_SECRET
✅ ADMIN_PASSWORD

# Supabase (NEW - need to add)
⬜ NEXT_PUBLIC_SUPABASE_URL
⬜ NEXT_PUBLIC_SUPABASE_ANON_KEY
⬜ SUPABASE_SERVICE_ROLE_KEY
```

## 🎯 Next Steps

1. **Set up Supabase Storage** (see SUPABASE_SETUP.md)
2. **Add environment variables** to `.env`
3. **Restart development server**
4. **Test image upload**
5. **Create your first product with images!**

## 📚 Documentation

- **Detailed Setup**: See `SUPABASE_SETUP.md`
- **Admin Panel Guide**: See `ADMIN_PANEL.md`
- **API Documentation**: See inline comments in code

## 🔐 Security Notes

- ✅ Service role key only used server-side
- ✅ Admin authentication required for uploads
- ✅ File type validation on server
- ✅ File size limits enforced
- ✅ Rate limiting active (100 req/min)

## 💡 Tips

1. **Optimize images before upload**
   - Compress to < 500KB
   - Resize to 800x800px
   - Use WebP for better compression

2. **Use descriptive filenames**
   - System auto-generates unique names
   - Original name preserved in metadata

3. **Monitor storage usage**
   - Check Supabase dashboard
   - Free tier: 1GB storage

4. **Backup important images**
   - Download from Supabase Storage
   - Keep local copies

## ✨ Features Summary

| Feature | Status | Description |
|---------|--------|-------------|
| Main Image Upload | ✅ | Upload single main product image |
| Multiple Images | ✅ | Upload up to 5 additional images |
| Image Preview | ✅ | Real-time preview before save |
| Drag & Drop | ✅ | Native browser file selection |
| URL Fallback | ✅ | Can still paste URLs manually |
| File Validation | ✅ | Type and size checks |
| Progress Indicator | ✅ | Shows upload status |
| Remove Images | ✅ | Delete individual images |
| Admin Only | ✅ | Secure access control |
| Supabase Storage | ✅ | Cloud storage integration |

## 🎉 You're Ready!

Once you complete the Supabase setup, you'll be able to:
- ✅ Upload images directly from admin panel
- ✅ Store images in Supabase Storage
- ✅ Manage product images easily
- ✅ No need for external image hosting

Happy uploading! 🚀
