# 🔄 Migration Guide: Old API to New v1 API

This guide helps you migrate from the old API routes to the new `/api/v1/*` routes.

## 📊 API Route Mapping

### Authentication

| Old Route | New Route | Changes |
|-----------|-----------|---------|
| `POST /api/auth/login` | `POST /api/v1/auth/login` | Same functionality |
| `POST /api/auth/register` | `POST /api/v1/auth/register` | Same functionality |
| `GET /api/auth/me` | `GET /api/v1/auth/me` | Same functionality |
| `POST /api/auth/logout` | `POST /api/v1/auth/logout` | Same functionality |

### Products

| Old Route | New Route | Changes |
|-----------|-----------|---------|
| `GET /api/products` | `GET /api/v1/products` | Same query params |
| `POST /api/products` | `POST /api/v1/products` | Same body structure |
| `GET /api/products/[id]` | `GET /api/v1/products/[id]` | Same |
| `PUT /api/products/[id]` | `PUT /api/v1/products/[id]` | Same |
| `DELETE /api/products/[id]` | `DELETE /api/v1/products/[id]` | Same |

### Cart

| Old Route | New Route | Changes |
|-----------|-----------|---------|
| `GET /api/cart` | `GET /api/v1/cart` | Response: `{ success, data: { items } }` |
| `POST /api/cart` | `POST /api/v1/cart` | Body: `{ productId, quantity }` |
| `DELETE /api/cart` | `DELETE /api/v1/cart` | Same |
| `PUT /api/cart/[id]` | `PUT /api/v1/cart/[id]` | Body: `{ quantity }` |
| `DELETE /api/cart/[id]` | `DELETE /api/v1/cart/[id]` | Same |

### Orders

| Old Route | New Route | Changes |
|-----------|-----------|---------|
| `GET /api/orders` | `GET /api/v1/orders` | Same query params |
| `POST /api/orders` | `POST /api/v1/orders` | Same body structure |
| `GET /api/orders/[id]` | `GET /api/v1/orders/[id]` | Same |
| `PUT /api/orders/[id]` | `PUT /api/v1/orders/[id]` | Admin only, body: `{ status?, paymentStatus? }` |

### Wishlist

| Old Route | New Route | Changes |
|-----------|-----------|---------|
| `GET /api/wishlist` | `GET /api/v1/wishlist` | Response: `{ success, data: { items } }` |
| `POST /api/wishlist` | `POST /api/v1/wishlist` | Body: `{ productId }` |
| `DELETE /api/wishlist?productId=xxx` | `DELETE /api/v1/wishlist?productId=xxx` | Same |
| `GET /api/wishlist/check?productId=xxx` | `GET /api/v1/wishlist/check?productId=xxx` | Same |

### Reviews

| Old Route | New Route | Changes |
|-----------|-----------|---------|
| `GET /api/reviews?productId=xxx` | `GET /api/v1/reviews?productId=xxx` | Same |
| `POST /api/reviews` | `POST /api/v1/reviews` | Body: `{ productId, rating, comment? }` |
| `PUT /api/reviews/[id]` | `PUT /api/v1/reviews/[id]` | Body: `{ rating?, comment? }` |
| `DELETE /api/reviews/[id]` | `DELETE /api/v1/reviews/[id]` | Same |

### Addresses

| Old Route | New Route | Changes |
|-----------|-----------|---------|
| `GET /api/addresses` | `GET /api/v1/addresses` | Same |
| `POST /api/addresses` | `POST /api/v1/addresses` | Same body structure |
| `GET /api/addresses/[id]` | `GET /api/v1/addresses/[id]` | Same |
| `PUT /api/addresses/[id]` | `PUT /api/v1/addresses/[id]` | Same |
| `DELETE /api/addresses/[id]` | `DELETE /api/v1/addresses/[id]` | Same |

## 🔧 Response Format

All v1 API routes follow a consistent response format:

### Success Response
```typescript
{
  success: true,
  data: T,
  message?: string,
  meta?: {
    page?: number,
    limit?: number,
    total?: number,
    totalPages?: number
  }
}
```

### Error Response
```typescript
{
  success: false,
  error: string,
  errors?: Array<{ field: string; message: string }>,
  code?: string
}
```

## 📝 Migration Steps

### 1. Update API Base URL

Create a constant for the API base URL:

```typescript
// lib/api.ts
export const API_BASE_URL = '/api/v1';
```

### 2. Update Fetch Calls

**Before:**
```typescript
const response = await fetch('/api/products');
```

**After:**
```typescript
const response = await fetch('/api/v1/products');
```

### 3. Update Response Handling

**Before:**
```typescript
const data = await response.json();
if (data.success && data.data) {
  setProducts(data.data);
}
```

**After:**
```typescript
const result = await response.json();
if (result.success && result.data) {
  // Handle pagination meta if present
  if (result.meta) {
    setPagination(result.meta);
  }
  setProducts(result.data);
} else {
  // Handle error
  console.error(result.error);
}
```

### 4. Update Cart/Wishlist Responses

**Before:**
```typescript
const data = await response.json();
if (data.success && data.data) {
  setCartItems(data.data); // Direct array
}
```

**After:**
```typescript
const result = await response.json();
if (result.success && result.data) {
  setCartItems(result.data.items); // Nested in items property
}
```

## 🎯 Component Migration Examples

### Product Fetching

**Before:**
```typescript
useEffect(() => {
  const fetchProducts = async () => {
    const response = await fetch('/api/products');
    const data = await response.json();
    if (data.success && data.data) {
      setProducts(data.data);
    }
  };
  fetchProducts();
}, []);
```

**After:**
```typescript
useEffect(() => {
  const fetchProducts = async () => {
    const response = await fetch('/api/v1/products');
    const result = await response.json();
    if (result.success && result.data) {
      setProducts(result.data);
      if (result.meta) {
        setTotalPages(result.meta.totalPages);
      }
    } else {
      toast.error(result.error || 'Failed to fetch products');
    }
  };
  fetchProducts();
}, []);
```

### Cart Operations

**Before:**
```typescript
const addToCart = async (productId: string) => {
  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity: 1 }),
  });
  const data = await response.json();
  if (data.success) {
    // Update cart
  }
};
```

**After:**
```typescript
const addToCart = async (productId: string) => {
  const response = await fetch('/api/v1/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity: 1 }),
  });
  const result = await response.json();
  if (result.success) {
    toast.success(result.message || 'Item added to cart');
    // Refresh cart
    await fetchCart();
  } else {
    toast.error(result.error || 'Failed to add to cart');
  }
};
```

## ⚠️ Breaking Changes

1. **Cart/Wishlist Response Structure**: Items are now nested in `data.items` instead of `data` directly
2. **Error Handling**: All errors now follow the consistent format with `success: false`
3. **Pagination**: Pagination metadata is now in `meta` property

## ✅ Benefits of New API

1. **Consistent Response Format**: All routes follow the same structure
2. **Better Error Handling**: Standardized error responses with codes
3. **Type Safety**: Full TypeScript support
4. **Validation**: Input validation with Zod schemas
5. **Service Layer**: Business logic separated from routes
6. **Maintainability**: Cleaner, more organized code

## 🔄 Backward Compatibility

The old API routes (`/api/*`) are still functional for backward compatibility. However, we recommend migrating to `/api/v1/*` for:
- Better error handling
- Consistent response format
- Future features and improvements
- Type safety

## 📚 Additional Resources

- See `ARCHITECTURE_REFACTORING_PLAN.md` for architecture details
- See `REFACTORING_PROGRESS.md` for implementation status
- Check individual domain folders in `src/domains/` for service methods

