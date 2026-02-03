/**
 * Payment validators
 */

import { z } from 'zod';

export const createPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  gateway: z.enum(['razorpay', 'cod']),
});

export const verifyPaymentSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
  signature: z.string().min(1, 'Signature is required'),
});

export const processCODSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
});

export const refundSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  amount: z.number().positive().optional(),
  notes: z.record(z.string()).optional(),
});

