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

const baseProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Slug is required'),
  sku: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  price: z.number().positive('Price must be positive'),
  originalPrice: z.number().positive().optional().nullable(),
  image: z.string().min(1, 'Image is required').refine(
    (val) => {
      // Accept full URLs or relative paths starting with /
      return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/');
    },
    { message: 'Image must be a valid URL or relative path starting with /' }
  ),
  images: z.array(
    z.string().refine(
      (val) => {
        return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/');
      },
      { message: 'Image must be a valid URL or relative path starting with /' }
    )
  ).optional().default([]),
  category: z.string().optional().or(z.literal('')), // Legacy: kept for backward compatibility
  categoryId: z.string().optional().or(z.literal('')), // New: FK to Category
  status: productStatusSchema.default('DRAFT'),
  inStock: z.boolean().default(true),
  stockQuantity: z.number().int().min(0).default(0),
  
  // SEO fields
  metaTitle: z.string().optional().or(z.literal('')),
  metaDescription: z.string().optional().or(z.literal('')),
  metaKeywords: z.array(z.string()).optional().default([]),
  ogImage: z.union([
    z.string().refine(
      (val) => {
        return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/');
      },
      { message: 'OG Image must be a valid URL or relative path starting with /' }
    ),
    z.literal('')
  ]).optional(),
  
  // Physical attributes
  weight: z.number().positive().optional().nullable(),
  dimensions: dimensionsSchema,
  taxClass: z.string().optional().default('standard'),
  
  // Supplier information
  supplierName: z.string().optional().or(z.literal('')),
  supplierLocation: z.string().optional().or(z.literal('')),
  supplierCertification: z.string().optional().or(z.literal('')),
  
  // Return policy
  returnPolicy: z.string().optional().or(z.literal('')),
  returnDays: z.number().int().min(0).optional().nullable(),
  
  // Relations
  brandId: z.string().optional().or(z.literal('')),
  tagIds: z.array(z.string()).optional().default([]),
  attributes: z.array(z.object({
    key: z.string().min(1),
    value: z.string().min(1),
  })).optional().default([]),
});

export const createProductSchema = baseProductSchema.transform((data) => {
  // Transform empty strings to undefined for optional fields
  return {
    ...data,
    sku: data.sku === '' ? undefined : data.sku,
    description: data.description === '' ? undefined : data.description,
    originalPrice: data.originalPrice === null ? undefined : data.originalPrice,
    category: data.category === '' ? undefined : data.category,
    categoryId: data.categoryId === '' ? undefined : data.categoryId,
    metaTitle: data.metaTitle === '' ? undefined : data.metaTitle,
    metaDescription: data.metaDescription === '' ? undefined : data.metaDescription,
    ogImage: data.ogImage === '' ? undefined : data.ogImage,
    weight: data.weight === null ? undefined : data.weight,
    supplierName: data.supplierName === '' ? undefined : data.supplierName,
    supplierLocation: data.supplierLocation === '' ? undefined : data.supplierLocation,
    supplierCertification: data.supplierCertification === '' ? undefined : data.supplierCertification,
    returnPolicy: data.returnPolicy === '' ? undefined : data.returnPolicy,
    returnDays: data.returnDays === null ? undefined : data.returnDays,
    brandId: data.brandId === '' ? undefined : data.brandId,
  };
});

export const updateProductSchema = baseProductSchema.partial();

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

