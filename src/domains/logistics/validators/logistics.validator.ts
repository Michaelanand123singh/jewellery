/**
 * Logistics validators
 */

import { z } from 'zod';

export const checkServiceabilitySchema = z.object({
  pickupPincode: z.string().regex(/^\d{6}$/, 'Pickup pincode must be 6 digits'),
  deliveryPincode: z.string().regex(/^\d{6}$/, 'Delivery pincode must be 6 digits'),
  weight: z.number().positive().optional(),
  codAmount: z.number().positive().optional(),
});

export const createShipmentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  courierId: z.number().optional(),
});

export const getTrackingSchema = z.object({
  awbNumber: z.string().min(1, 'AWB number is required'),
});

