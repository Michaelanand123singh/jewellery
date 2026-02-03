/**
 * Product validation schemas
 */

import { z } from 'zod';

const productStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

const dimensionsSchema = z.object({
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  unit: z.string().optional(),
}).optional().nullable();

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Slug is required'),
  sku: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  originalPrice: z.number().positive().optional(),
  image: z.string().url('Image must be a valid URL'),
  images: z.array(z.string().url()).optional().default([]),
  category: z.string().optional(), // Legacy: kept for backward compatibility
  categoryId: z.string().optional(), // New: FK to Category
  status: productStatusSchema.default('DRAFT'),
  inStock: z.boolean().default(true),
  stockQuantity: z.number().int().min(0).default(0),
  
  // SEO fields
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).optional().default([]),
  ogImage: z.string().url().optional(),
  
  // Physical attributes
  weight: z.number().positive().optional(),
  dimensions: dimensionsSchema,
  taxClass: z.string().optional().default('standard'),
  
  // Supplier information
  supplierName: z.string().optional(),
  supplierLocation: z.string().optional(),
  supplierCertification: z.string().optional(),
  
  // Return policy
  returnPolicy: z.string().optional(),
  returnDays: z.number().int().min(0).optional(),
  
  // Relations
  brandId: z.string().optional(),
  tagIds: z.array(z.string()).optional().default([]),
  attributes: z.array(z.object({
    key: z.string().min(1),
    value: z.string().min(1),
  })).optional().default([]),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// Product Variant schemas
export const createProductVariantSchema = z.object({
  productId: z.string().min(1),
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Variant name is required'),
  price: z.number().positive().optional(),
  stockQuantity: z.number().int().min(0).default(0),
  attributes: z.record(z.string(), z.string()).refine(
    (attrs) => Object.keys(attrs).length > 0,
    'At least one attribute is required'
  ),
  image: z.string().url().optional(),
});

export const updateProductVariantSchema = createProductVariantSchema.partial().omit({ productId: true });

export type CreateProductVariantInput = z.infer<typeof createProductVariantSchema>;
export type UpdateProductVariantInput = z.infer<typeof updateProductVariantSchema>;

// Brand schemas
export const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  slug: z.string().min(1, 'Slug is required'),
  logo: z.string().url().optional(),
  description: z.string().optional(),
});

export const updateBrandSchema = createBrandSchema.partial();

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;

// Product Tag schemas
export const createProductTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required'),
  slug: z.string().min(1, 'Slug is required'),
});

export const updateProductTagSchema = createProductTagSchema.partial();

export type CreateProductTagInput = z.infer<typeof createProductTagSchema>;
export type UpdateProductTagInput = z.infer<typeof updateProductTagSchema>;

