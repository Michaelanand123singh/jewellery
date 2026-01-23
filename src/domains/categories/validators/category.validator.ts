/**
 * Category validators using Zod
 */

import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name is too long'),
  slug: z.string().optional(),
  description: z.string().max(500, 'Description is too long').optional(),
  image: z.string().url('Invalid image URL').optional().or(z.literal('')),
  parentId: z.string().nullable().optional(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name is too long').optional(),
  slug: z.string().optional(),
  description: z.string().max(500, 'Description is too long').optional(),
  image: z.string().url('Invalid image URL').optional().or(z.literal('')),
  parentId: z.string().nullable().optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

