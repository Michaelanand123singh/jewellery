/**
 * Inventory validators using Zod
 */

import { z } from 'zod';

export const stockMovementTypeSchema = z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RETURN', 'TRANSFER']);

export const createStockMovementSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  type: stockMovementTypeSchema,
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  reason: z.string().optional(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  createdBy: z.string().optional(),
});

export const adjustStockSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().refine((val) => val !== 0, {
    message: 'Quantity cannot be zero',
  }),
  reason: z.string().min(1, 'Reason is required for stock adjustments'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']).default('ADJUSTMENT'),
});

export const bulkAdjustStockSchema = z.object({
  adjustments: z.array(adjustStockSchema).min(1, 'At least one adjustment is required'),
});

