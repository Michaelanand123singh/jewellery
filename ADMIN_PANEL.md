# Admin Panel Documentation

## Overview

The Admin Panel provides a comprehensive Product Management system for the Jewellery E-commerce store. Admin users can add, edit, and delete products through an intuitive interface.

## Access

### Admin Login URL
```
http://localhost:3000/login
```

### Admin Dashboard URL
```
http://localhost:3000/admin
```

### Default Admin Credentials
- **Email:** `admin@jewellery.com`
- **Password:** Set via `ADMIN_PASSWORD` environment variable (default: `change-this-immediately-in-production`)

## Features

### 1. Product Management
- ✅ **View All Products** - Display all products in a table format with images, prices, stock, and status
- ✅ **Add New Product** - Create new products with complete details
- ✅ **Edit Product** - Update existing product information
- ✅ **Delete Product** - Remove products from the store
- ✅ **Auto-slug Generation** - Automatically generates URL-friendly slugs from product names
- ✅ **Stock Management** - Track inventory and stock status
- ✅ **Image Management** - Support for main image and multiple additional images

### 2. Security Features
- ✅ **Role-Based Access Control** - Only users with ADMIN role can access the admin panel
- ✅ **CSRF Protection** - All state-changing operations are protected with CSRF tokens
- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Automatic Redirect** - Non-admin users are redirected to home page

### 3. User Experience
- ✅ **Responsive Design** - Works on desktop and mobile devices
- ✅ **Real-time Validation** - Form validation with helpful error messages
- ✅ **Toast Notifications** - Success and error notifications for all operations
- ✅ **Loading States** - Visual feedback during data operations
- ✅ **Confirmation Dialogs** - Prevent accidental deletions

## Product Form Fields

### Required Fields
1. **Product Name** - The display name of the product
2. **Slug** - URL-friendly identifier (auto-generated from name)
3. **Price** - Current selling price in ₹
4. **Category** - Product category (e.g., Rings, Necklaces, Earrings)
5. **Main Image URL** - Primary product image URL
6. **Stock Quantity** - Number of items in stock

### Optional Fields
1. **Description** - Detailed product description
2. **Original Price** - Original price for showing discounts
3. **Additional Images** - Comma-separated list of image URLs
4. **In Stock** - Checkbox to mark product availability

## How to Use

### Adding a New Product

1. Navigate to `/admin` (Admin Dashboard link appears in header for admin users)
2. Click the **"Add Product"** button
3. Fill in the product details:
   - Enter product name (slug auto-generates)
   - Add description
   - Set price and optional original price
   - Select category
   - Add main image URL
   - Optionally add multiple image URLs (comma-separated)
   - Set stock quantity
   - Check "In Stock" if available
4. Click **"Create Product"**
5. Success notification will appear and product list will refresh

### Editing a Product

1. Find the product in the table
2. Click the **Edit** button (pencil icon)
3. Modify the desired fields
4. Click **"Update Product"**
5. Changes will be saved and reflected immediately

### Deleting a Product

1. Find the product in the table
2. Click the **Delete** button (trash icon)
3. Confirm the deletion in the popup dialog
4. Product will be removed from the database

## API Endpoints Used

### GET /api/csrf
- Generates CSRF token for secure operations
- Returns token in response and sets it in cookie

### GET /api/products
- Fetches all products with pagination
- Query params: `limit`, `page`, `category`, `search`, etc.

### POST /api/products
- Creates a new product
- Requires: Admin authentication + CSRF token
- Body: Product data (name, slug, price, image, etc.)

### PUT /api/products/:id
- Updates an existing product
- Requires: Admin authentication + CSRF token
- Body: Updated product fields

### DELETE /api/products/:id
- Deletes a product
- Requires: Admin authentication + CSRF token

## Security Implementation

### Authentication Flow
1. User logs in with admin credentials
2. JWT token is stored in HTTP-only cookie
3. Every request includes the auth token
4. Server validates token and checks for ADMIN role

### CSRF Protection Flow
1. Admin page fetches CSRF token on load
2. Token is stored in state and cookie
3. All POST/PUT/DELETE requests include token in `x-csrf-token` header
4. Server validates token before processing request
5. Token is refreshed after each operation

## Database Schema

Products are stored with the following structure:

```typescript
{
  id: string              // Unique identifier (CUID)
  name: string            // Product name
  slug: string            // URL-friendly identifier (unique)
  description?: string    // Product description
  price: number           // Current price
  originalPrice?: number  // Original price (for discounts)
  image: string           // Main image URL
  images: string[]        // Additional image URLs
  category: string        // Product category
  inStock: boolean        // Availability status
  stockQuantity: number   // Inventory count
  rating?: number         // Average rating
  reviewCount: number     // Number of reviews
  createdAt: DateTime     // Creation timestamp
  updatedAt: DateTime     // Last update timestamp
}
```

## Image URL Guidelines

### Supported Formats
- HTTPS URLs only
- Formats: JPG, JPEG, PNG, WebP
- Recommended size: 800x800px minimum

### Example Image URLs
```
Main Image:
https://example.com/products/gold-ring.jpg

Additional Images (comma-separated):
https://example.com/products/gold-ring-side.jpg, https://example.com/products/gold-ring-top.jpg
```

### Image Hosting Options
1. **Cloudinary** - Recommended for production
2. **AWS S3** - Scalable cloud storage
3. **Supabase Storage** - If using Supabase
4. **Public URLs** - Any publicly accessible image URL

## Troubleshooting

### Cannot Access Admin Panel
- **Issue:** Redirected to home page
- **Solution:** Ensure you're logged in with an admin account
- **Check:** User role must be "ADMIN" in database

### CSRF Token Error
- **Issue:** "CSRF token validation failed"
- **Solution:** Refresh the page to get a new token
- **Note:** Token expires after 24 hours

### Product Not Saving
- **Issue:** Form submission fails
- **Check:** 
  - All required fields are filled
  - Image URLs are valid HTTPS URLs
  - Price and stock quantity are positive numbers
  - Slug is unique (not used by another product)

### Images Not Displaying
- **Issue:** Broken image icons
- **Solution:** 
  - Verify image URLs are publicly accessible
  - Check HTTPS (not HTTP)
  - Ensure URLs are properly formatted

## Environment Variables

Required environment variables for admin functionality:

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Authentication
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"

# Admin Account
ADMIN_PASSWORD="your-secure-admin-password"

# CSRF Protection
CSRF_SECRET="your-csrf-secret-key-minimum-32-characters-long"
ENABLE_STRICT_CSRF="false"  # Set to "true" in production

# Environment
NODE_ENV="development"  # or "production"
```

## Best Practices

### Product Management
1. **Use Descriptive Names** - Clear, searchable product names
2. **Optimize Images** - Compress images before uploading
3. **Consistent Categories** - Use standardized category names
4. **Accurate Stock** - Keep inventory counts updated
5. **Competitive Pricing** - Set appropriate prices

### Security
1. **Change Default Password** - Never use default admin password in production
2. **Enable Strict CSRF** - Set `ENABLE_STRICT_CSRF=true` in production
3. **Use HTTPS** - Always use HTTPS in production
4. **Regular Backups** - Backup database regularly
5. **Monitor Logs** - Check logs for suspicious activity

### Performance
1. **Optimize Images** - Use CDN for image hosting
2. **Limit Results** - Use pagination for large product lists
3. **Cache Responses** - API responses are cached for 60 seconds
4. **Lazy Loading** - Images load on demand

## Future Enhancements

Potential features for future development:

- [ ] Bulk product upload (CSV/Excel)
- [ ] Image upload directly from admin panel
- [ ] Product variants (size, color, etc.)
- [ ] Order management
- [ ] Customer management
- [ ] Analytics dashboard
- [ ] Inventory alerts
- [ ] Product categories management
- [ ] Discount/coupon management
- [ ] SEO optimization tools

## Support

For issues or questions:
1. Check this documentation
2. Review error messages in browser console
3. Check server logs
4. Verify environment variables
5. Ensure database is running

## Version History

### v1.0.0 (Current)
- Initial admin panel implementation
- Product CRUD operations
- CSRF protection
- Role-based access control
- Responsive design
- Toast notifications
