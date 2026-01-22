/**
 * Product validation schemas
 */

import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  originalPrice: z.number().positive().optional(),
  image: z.string().url('Image must be a valid URL'),
  images: z.array(z.string().url()).optional().default([]),
  category: z.string().min(1, 'Category is required'),
  inStock: z.boolean().default(true),
  stockQuantity: z.number().int().min(0).default(0),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

