# Product Management - Frontend & Admin Panel Mapping

## Overview
This document maps the complete product management flow from database to frontend display, ensuring consistency across all layers.

## Database Schema (Prisma)

```prisma
model Product {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique
  description   String?  @db.Text
  price         Float
  originalPrice Float?
  image         String
  images        String[] @default([])
  category      String
  inStock       Boolean  @default(true)
  stockQuantity Int      @default(0)
  rating        Float?   @default(0)
  reviewCount   Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## Type Definitions

### Frontend Product Interface (`lib/store.ts`)
```typescript
export interface Product {
  id: string;
  name: string;
  slug: string;                    // ✅ Added
  price: number;
  originalPrice?: number | null;
  image: string;
  images?: string[];
  description?: string | null;
  category: string;
  rating?: number | null;
  reviewCount?: number;            // ✅ Added
  inStock?: boolean;
  stockQuantity?: number | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
```

### Admin Product Interface (`components/admin/ProductManagement.tsx`)
```typescript
interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category: string;
  inStock: boolean;
  stockQuantity: number;
  rating?: number;
  reviewCount: number;
}
```

## API Endpoints

### 1. GET `/api/products` (Legacy)
- **Purpose**: Get all products with filters
- **Returns**: All product fields including `slug` and `reviewCount`
- **Used by**: Admin panel (now updated to use v1)

### 2. GET `/api/v1/products` (Current)
- **Purpose**: Get all products with filters (service layer)
- **Returns**: All product fields including `slug` and `reviewCount`
- **Used by**: Frontend shop page, Admin panel

### 3. GET `/api/products/[id]` (Legacy)
- **Purpose**: Get single product by ID
- **Returns**: Product + reviews array
- **Used by**: Product detail page (via apiClient → v1)

### 4. GET `/api/v1/products/[id]` (Current)
- **Purpose**: Get single product by ID (service layer)
- **Returns**: Product + reviews array
- **Used by**: Product detail page (via apiClient)

### 5. POST `/api/v1/products` (Admin Only)
- **Purpose**: Create new product
- **Requires**: Admin authentication + CSRF token
- **Body**: All product fields except `rating` and `reviewCount` (auto-calculated)

### 6. PUT `/api/v1/products/[id]` (Admin Only)
- **Purpose**: Update existing product
- **Requires**: Admin authentication + CSRF token
- **Body**: Partial product fields

### 7. DELETE `/api/v1/products/[id]` (Admin Only)
- **Purpose**: Delete product
- **Requires**: Admin authentication + CSRF token

## Data Flow

### Frontend Display Flow

1. **Shop Page** (`app/(public)/shop/page.tsx`)
   - Fetches: `/api/v1/products` with filters
   - Displays: ProductCard or ProductListItem
   - Uses: `id`, `name`, `slug`, `price`, `originalPrice`, `image`, `images`, `category`, `rating`, `reviewCount`, `inStock`, `stockQuantity`

2. **Product Detail Page** (`app/(public)/products/[id]/page.tsx`)
   - Fetches: `/api/v1/products/[id]`
   - Receives: Product + reviews array
   - Uses: All product fields including `slug` for SKU display
   - Displays: Full product details, images, reviews, related products

3. **Product Cards** (`components/home/ProductCard.tsx`)
   - Uses: `id`, `name`, `price`, `originalPrice`, `image`, `rating`, `reviewCount`, `stockQuantity`
   - Displays: Brand (from name), title, rating with review count, price, discount badge

### Admin Panel Flow

1. **Product List** (`components/admin/ProductManagement.tsx`)
   - Fetches: `/api/v1/products?limit=100`
   - Displays: Table with all products
   - Shows: Image, name, category, price, stock, status

2. **Create/Edit Product**
   - Form Fields:
     - ✅ Product Name (auto-generates slug)
     - ✅ Slug (editable)
     - ✅ Description
     - ✅ Price
     - ✅ Original Price (optional)
     - ✅ Category
     - ✅ Main Image (upload or URL)
     - ✅ Additional Images (upload or URLs)
     - ✅ Stock Quantity
     - ✅ In Stock checkbox
   - Saves: `/api/v1/products` (POST) or `/api/v1/products/[id]` (PUT)

3. **Delete Product**
   - Calls: `/api/v1/products/[id]` (DELETE)

## Field Mapping

| Database Field | Frontend Interface | Admin Interface | API Response | Display Usage |
|---------------|-------------------|-----------------|--------------|---------------|
| `id` | ✅ | ✅ | ✅ | Product links, cart, wishlist |
| `name` | ✅ | ✅ | ✅ | Product title, brand extraction |
| `slug` | ✅ | ✅ | ✅ | SKU display, URL-friendly identifier |
| `description` | ✅ | ✅ | ✅ | Product detail page, list view |
| `price` | ✅ | ✅ | ✅ | All product displays |
| `originalPrice` | ✅ | ✅ | ✅ | Discount calculation, strikethrough price |
| `image` | ✅ | ✅ | ✅ | Main product image |
| `images[]` | ✅ | ✅ | ✅ | Image gallery, thumbnails |
| `category` | ✅ | ✅ | ✅ | Filtering, grouping, display |
| `inStock` | ✅ | ✅ | ✅ | Stock status badge, cart availability |
| `stockQuantity` | ✅ | ✅ | ✅ | Low stock warnings, inventory |
| `rating` | ✅ | ✅ | ✅ | Star display, sorting |
| `reviewCount` | ✅ | ✅ | ✅ | Review count display |
| `createdAt` | ✅ | - | ✅ | Sorting, display (optional) |
| `updatedAt` | ✅ | - | ✅ | Display (optional) |

## Key Changes Made

### 1. ✅ Unified Product Interface
- Updated `lib/store.ts` Product interface to include `slug` and `reviewCount`
- Removed type casts (`as any`) from frontend components
- All components now use proper TypeScript types

### 2. ✅ API Consistency
- Admin panel now uses `/api/v1/products` (consistent with frontend)
- v1 API GET `/api/v1/products/[id]` now includes reviews (matching legacy API)
- All APIs return consistent product structure

### 3. ✅ Frontend Updates
- ProductCard: Uses `product.reviewCount` directly (no type cast)
- ProductDetail: Uses `product.slug` directly (no type cast)
- All product displays properly handle all fields

### 4. ✅ Admin Panel Updates
- Uses `/api/v1/products` endpoint (consistent with frontend)
- Form handles all required fields
- Proper validation and error handling

## Data Validation

### Admin Form Validation
- **Required**: name, slug, price, category, image, stockQuantity
- **Optional**: description, originalPrice, images[], inStock
- **Auto-generated**: slug (from name, but editable)
- **Auto-calculated**: rating, reviewCount (from reviews)

### API Validation
- Uses Zod schemas for validation
- CSRF protection for state-changing operations
- Admin authentication required for POST/PUT/DELETE

## Testing Checklist

- [x] Frontend shop page displays all products correctly
- [x] Product detail page shows all fields including slug and reviewCount
- [x] Admin can create products with all fields
- [x] Admin can edit products
- [x] Admin can delete products
- [x] Product cards display rating and review count
- [x] Stock quantity is properly displayed and validated
- [x] Images (main + additional) work correctly
- [x] API endpoints return consistent data structure

## Notes

1. **Rating & ReviewCount**: These are calculated fields based on reviews. Admins cannot manually set them.

2. **Slug**: Auto-generated from product name but can be manually edited in admin panel.

3. **Stock Management**: `inStock` is automatically set based on `stockQuantity > 0` in some operations, but can be manually toggled in admin.

4. **Image Upload**: Admin panel supports both file upload (via `/api/upload`) and direct URL input.

5. **API Versioning**: The codebase uses both `/api/products` (legacy) and `/api/v1/products` (current). Frontend and admin now consistently use v1.

