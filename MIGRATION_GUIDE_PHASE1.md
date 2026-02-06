# Phase 1 Migration Guide - Product Module Upgrade

## Overview
This document outlines the database migration required for Phase 1 of the Product Module upgrade.

## Migration Steps

### 1. Prisma Schema Changes

The following changes have been made to `prisma/schema.prisma`:

#### New Enum
- `ProductStatus`: `DRAFT`, `PUBLISHED`, `ARCHIVED`

#### Extended Product Model
Added fields:
- `sku` (String?, unique)
- `status` (ProductStatus, default: DRAFT)
- `categoryId` (String?, FK to Category) - **New FK relationship**
- `metaTitle`, `metaDescription`, `metaKeywords[]`, `ogImage` - SEO fields
- `weight`, `dimensions` (JSON), `taxClass` - Physical attributes
- `supplierName`, `supplierLocation`, `supplierCertification` - Supplier info
- `returnPolicy`, `returnDays` - Return policy
- `brandId` (String?, FK to Brand)

#### New Models Created
1. **Brand** - Brand management
2. **ProductVariant** - Product variants with attributes
3. **ProductAttribute** - Product specifications
4. **ProductTag** - Product tags (many-to-many with Product)

#### Updated Models
- **CartItem**: Added `variantId` (optional FK to ProductVariant)
- **OrderItem**: Added `variantId` (optional FK to ProductVariant)
- **Category**: Added `products` relation

### 2. Running the Migration

**IMPORTANT**: This migration maintains backward compatibility:
- `category` string field is kept for existing products
- New `categoryId` FK is optional
- Existing products will continue to work

```bash
# Generate migration
npx prisma migrate dev --name add_product_enhancements

# Or push directly (for development)
npx prisma db push
```

### 3. Data Migration (Post-Migration)

After running the migration, you may want to migrate existing category strings to FK relationships:

```sql
-- Example: Update products to use categoryId based on category slug
-- This should be done carefully based on your category structure
UPDATE products p
SET "categoryId" = c.id
FROM categories c
WHERE p.category = c.slug;
```

### 4. Backward Compatibility

- Existing API endpoints continue to work
- `category` string field is still supported
- New fields are optional
- Products default to `DRAFT` status (filter in queries if needed)

### 5. Testing Checklist

- [ ] Migration runs successfully
- [ ] Existing products are accessible
- [ ] New products can be created with all fields
- [ ] Variants can be created and linked
- [ ] Brands can be created and linked
- [ ] Tags can be created and linked
- [ ] Attributes can be created
- [ ] Cart items with variants work
- [ ] Order items with variants work

## Next Steps

After migration:
1. Update domain types (✅ Done)
2. Update repositories (✅ Done)
3. Update services (✅ In Progress)
4. Update API endpoints
5. Update Admin UI
6. Update Frontend

