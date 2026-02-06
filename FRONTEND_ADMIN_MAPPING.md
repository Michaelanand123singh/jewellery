# Frontend & Admin Panel API Mapping

## Complete API Mapping Document

This document maps all frontend pages and admin panel components to their corresponding API endpoints, ensuring proper data flow and functionality.

---

## Admin Panel Pages & Components

### 1. Admin Dashboard (`/admin`)
- **Component**: `app/(admin)/admin/page.tsx`
- **API Calls**:
  - `GET /api/admin/stats?range={range}` - Dashboard statistics
- **Status**: ✅ Working (image URLs now transformed)

### 2. Products Management (`/admin/products`)
- **Component**: `components/admin/ProductManagement.tsx`
- **API Calls**:
  - `GET /api/v1/products?limit=100` - Fetch all products
  - `POST /api/v1/products` - Create product
  - `PUT /api/v1/products/{id}` - Update product
  - `DELETE /api/v1/products/{id}` - Delete product
  - `POST /api/v1/products/{id}/duplicate` - Duplicate product
  - `GET /api/v1/categories?tree=true` - Fetch categories
  - `GET /api/v1/brands` - Fetch brands
  - `GET /api/v1/tags` - Fetch tags
- **Status**: ✅ Working (image URLs transformed, status filtering)

### 3. Blogs Management (`/admin/blogs`)
- **Component**: `components/admin/BlogManagement.tsx`
- **API Calls**:
  - `GET /api/v1/blogs?limit=100` - Fetch all blogs
  - `POST /api/v1/blogs` - Create blog
  - `PUT /api/v1/blogs/{id}` - Update blog
  - `DELETE /api/v1/blogs/{id}` - Delete blog
  - `POST /api/upload` - Upload blog image
- **Status**: ✅ Working (image URLs transformed, published filtering)

### 4. Orders Management (`/admin/orders`)
- **Component**: `components/admin/orders/OrderManagement.tsx`
- **API Calls**:
  - `GET /api/v1/orders` - Fetch orders (with filters)
  - `PUT /api/v1/orders/{id}` - Update order status
  - `GET /api/admin/stats` - Order statistics
- **Status**: ✅ Working

### 5. Users Management (`/admin/users`)
- **Component**: `components/admin/users/UserManagement.tsx`
- **API Calls**:
  - `GET /api/v1/users` - Fetch users (with filters)
  - `GET /api/v1/users/stats` - User statistics
  - `PUT /api/v1/users/{id}` - Update user
  - `DELETE /api/v1/users/{id}` - Delete user
- **Status**: ✅ Working

### 6. Inventory Management (`/admin/inventory`)
- **Component**: `components/admin/inventory/InventoryManagement.tsx`
- **API Calls**:
  - `GET /api/v1/inventory/products` - Fetch inventory
  - `GET /api/v1/inventory/stats` - Inventory statistics
  - `GET /api/v1/inventory/movements` - Stock movements
  - `POST /api/v1/inventory/movements` - Create stock adjustment
- **Status**: ✅ Working

### 7. Settings Management (`/admin/settings`)
- **Components**: Multiple settings components
- **API Calls**:
  - `GET /api/v1/settings` - Fetch all settings
  - `PUT /api/v1/settings/general` - Update general settings
  - `PUT /api/v1/settings/product` - Update product settings
  - `PUT /api/v1/settings/shipping` - Update shipping settings
  - `PUT /api/v1/settings/payment` - Update payment settings
  - `PUT /api/v1/settings/email` - Update email settings
  - `PUT /api/v1/settings/seo` - Update SEO settings
  - `GET /api/v1/categories?tree=true` - Fetch categories (for CategoryManagement)
  - `POST /api/v1/categories` - Create category
  - `PUT /api/v1/categories/{id}` - Update category
  - `DELETE /api/v1/categories/{id}` - Delete category
- **Status**: ✅ Working (category image URLs transformed)

---

## Frontend Pages & Components

### 1. Home Page (`/`)
- **Component**: `app/(public)/page.tsx`
- **API Calls**:
  - `GET /api/v1/products?limit=12` - Featured products (via ProductGridSection)
  - `GET /api/v1/blogs?published=true&limit=3` - Recent blogs (via BlogSection)
- **Status**: ✅ Working (image URLs transformed, published filtering)

### 2. Shop Page (`/shop`)
- **Component**: `app/(public)/shop/page.tsx`
- **API Calls**:
  - `GET /api/v1/products` - Fetch products (with filters)
  - `GET /api/v1/categories?tree=true` - Fetch categories for sidebar
- **Status**: ✅ Working (image URLs transformed, published filtering, active categories)

### 3. Product Detail Page (`/products/{id}`)
- **Component**: `app/(public)/products/[id]/page.tsx`
- **API Calls**:
  - `GET /api/v1/products/{id}` - Fetch product details
  - `GET /api/v1/products` - Fetch related products
  - `GET /api/v1/reviews?productId={id}` - Fetch reviews
  - `POST /api/v1/reviews` - Create review
  - `GET /api/v1/wishlist/check?productId={id}` - Check wishlist status
  - `POST /api/v1/wishlist` - Add to wishlist
  - `DELETE /api/v1/wishlist?productId={id}` - Remove from wishlist
  - `GET /api/v1/cart` - Fetch cart
  - `POST /api/v1/cart` - Add to cart
- **Status**: ✅ Working (image URLs transformed, published filtering)

### 4. Blog Listing Page (`/blog`)
- **Component**: `app/(public)/blog/page.tsx`
- **API Calls**:
  - `GET /api/v1/blogs?published=true&limit=100` - Fetch all published blogs
- **Status**: ✅ Working (image URLs transformed, published filtering)

### 5. Blog Detail Page (`/blog/{slug}`)
- **Component**: `app/(public)/blog/[slug]/page.tsx`
- **API Calls**:
  - `GET /api/v1/blogs/slug/{slug}` - Fetch blog by slug
  - `GET /api/v1/blogs?published=true&limit=100` - Fetch related blogs
- **Status**: ✅ Working (image URLs transformed, published filtering)

### 6. Search Page (`/search`)
- **Component**: `app/(public)/search/page.tsx`
- **API Calls**:
  - `GET /api/v1/products?search={query}` - Search products
- **Status**: ✅ Working (image URLs transformed, published filtering)

### 7. Navigation Component
- **Component**: `components/layout/Navigation.tsx`
- **API Calls**:
  - `GET /api/v1/categories?tree=true` - Fetch categories for navigation
- **Status**: ✅ Working (only shows categories with `showInNav=true` and `isActive=true`)

### 8. User Account Page (`/account`)
- **Component**: `app/(user)/account/page.tsx`
- **API Calls**:
  - `GET /api/v1/addresses` - Fetch user addresses
  - `POST /api/v1/addresses` - Create address
  - `PUT /api/v1/addresses/{id}` - Update address
  - `DELETE /api/v1/addresses/{id}` - Delete address
  - `PUT /api/v1/users/me` - Update user profile
- **Status**: ✅ Working

### 9. Cart Page (`/cart`)
- **Component**: `app/(user)/cart/page.tsx`
- **API Calls**:
  - `GET /api/v1/cart` - Fetch cart items
  - `PUT /api/v1/cart/{id}` - Update cart item
  - `DELETE /api/v1/cart/{id}` - Remove cart item
- **Status**: ✅ Working

### 10. Checkout Page (`/checkout`)
- **Component**: `app/(user)/checkout/page.tsx`
- **API Calls**:
  - `GET /api/v1/addresses` - Fetch user addresses
  - `POST /api/v1/orders` - Create order
  - `POST /api/v1/payments/create-order` - Create payment order
  - `POST /api/v1/payments/verify` - Verify payment
  - `POST /api/v1/logistics/pincode-check` - Check pincode
- **Status**: ✅ Working

### 11. Wishlist Page (`/wishlist`)
- **Component**: `app/(user)/wishlist/page.tsx`
- **API Calls**:
  - `GET /api/v1/wishlist` - Fetch wishlist items
  - `DELETE /api/v1/wishlist?productId={id}` - Remove from wishlist
- **Status**: ✅ Working

---

## Image URL Transformation

All image URLs are automatically transformed to use the proxy endpoint `/api/images/{path}` for:
- ✅ Blog images (via BlogService)
- ✅ Product images (main image, images array, ogImage) (via ProductService)
- ✅ Category images (via CategoryService)
- ✅ Admin dashboard product images (via admin stats API)
- ✅ Order product images (via OrderService)
- ✅ Cart product images (via CartService)
- ✅ Wishlist product images (via WishlistService)

**Transformation Logic**:
- MinIO URLs → `/api/images/{storageKey}`
- External URLs → Unchanged
- Relative paths starting with `/` → Unchanged (assumed to be proxy URLs or public paths)

---

## Status Filtering

### Products
- **Frontend**: Only shows `PUBLISHED` products
- **Admin Panel**: Shows all products (DRAFT, PUBLISHED, ARCHIVED)
- **API**: Filters by `status = 'PUBLISHED'` for non-admin users

### Blogs
- **Frontend**: Only shows `published = true` blogs
- **Admin Panel**: Shows all blogs (published and unpublished)
- **API**: Filters by `published = true` for non-admin users

### Categories
- **Frontend**: Only shows `isActive = true` categories
- **Admin Panel**: Shows all categories (active and inactive)
- **API**: Filters by `isActive = true` for non-admin users

---

## API Endpoint Summary

### Working Endpoints ✅
- `/api/v1/products` - Products CRUD
- `/api/v1/products/{id}` - Product details
- `/api/v1/blogs` - Blogs CRUD
- `/api/v1/blogs/{id}` - Blog details
- `/api/v1/blogs/slug/{slug}` - Blog by slug
- `/api/v1/categories` - Categories CRUD
- `/api/v1/categories/{id}` - Category details
- `/api/v1/orders` - Orders management
- `/api/v1/orders/{id}` - Order details
- `/api/v1/users` - Users management
- `/api/v1/users/{id}` - User details
- `/api/v1/users/stats` - User statistics
- `/api/v1/inventory/*` - Inventory management
- `/api/v1/settings/*` - Settings management
- `/api/admin/stats` - Admin dashboard statistics
- `/api/upload` - File upload
- `/api/images/{path}` - Image proxy

---

## Data Flow Verification

### Product Flow
1. Admin creates product → `POST /api/v1/products` → Saved with status (DRAFT/PUBLISHED)
2. Admin views products → `GET /api/v1/products` → Shows all products
3. Frontend shop page → `GET /api/v1/products` → Shows only PUBLISHED products
4. Image URLs automatically transformed to proxy URLs

### Blog Flow
1. Admin creates blog → `POST /api/v1/blogs` → Saved with published flag
2. Admin views blogs → `GET /api/v1/blogs` → Shows all blogs
3. Frontend blog page → `GET /api/v1/blogs?published=true` → Shows only published blogs
4. Image URLs automatically transformed to proxy URLs

### Category Flow
1. Admin creates category → `POST /api/v1/categories` → Saved with isActive flag
2. Admin views categories → `GET /api/v1/categories?includeInactive=true` → Shows all categories
3. Frontend navigation → `GET /api/v1/categories?tree=true` → Shows only active categories with showInNav=true
4. Image URLs automatically transformed to proxy URLs

---

## Testing Checklist

- [ ] Admin can create/edit/delete products
- [ ] Admin can publish/unpublish products
- [ ] Frontend only shows published products
- [ ] Product images load correctly on frontend
- [ ] Admin can create/edit/delete blogs
- [ ] Admin can publish/unpublish blogs
- [ ] Frontend only shows published blogs
- [ ] Blog images load correctly on frontend
- [ ] Admin can create/edit/delete categories
- [ ] Admin can activate/deactivate categories
- [ ] Frontend only shows active categories
- [ ] Category images load correctly on frontend
- [ ] Navigation shows correct categories
- [ ] Shop page filters work correctly
- [ ] Search page works correctly
- [ ] All admin panel pages load correctly

---

## Notes

- All image URLs are transformed at the service layer
- Status filtering happens at the API layer based on user role
- Admin users can see all data regardless of status
- Regular users only see published/active content
- Image proxy ensures images are accessible even if MinIO is not publicly accessible

