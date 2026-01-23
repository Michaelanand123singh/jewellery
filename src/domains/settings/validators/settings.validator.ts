/**
 * Settings validators using Zod
 */

import { z } from 'zod';

export const settingTypeSchema = z.enum(['string', 'number', 'boolean', 'json']);
export const settingGroupSchema = z.enum(['general', 'product', 'shipping', 'payment', 'email', 'seo', 'tax']);

export const createSettingSchema = z.object({
  key: z.string().min(1, 'Key is required').regex(/^[a-zA-Z0-9_]+$/, 'Key must contain only letters, numbers, and underscores'),
  value: z.string().min(1, 'Value is required'),
  type: settingTypeSchema.default('string'),
  group: settingGroupSchema,
  description: z.string().optional(),
});

export const updateSettingSchema = z.object({
  value: z.string().optional(),
  type: settingTypeSchema.optional(),
  description: z.string().optional(),
});

export const bulkUpdateSettingsSchema = z.object({
  settings: z.array(z.object({
    key: z.string(),
    value: z.string(),
    group: settingGroupSchema,
  })).min(1),
});

export const generalSettingsSchema = z.object({
  storeName: z.string().min(1, 'Store name is required'),
  storeEmail: z.string().email('Invalid email address'),
  storePhone: z.string().optional(),
  storeAddress: z.string().optional(),
  storeCity: z.string().optional(),
  storeState: z.string().optional(),
  storeCountry: z.string().default('India'),
  storePostalCode: z.string().optional(),
  currency: z.string().default('INR'),
  timezone: z.string().default('Asia/Kolkata'),
  language: z.string().default('en'),
});

export const productSettingsSchema = z.object({
  defaultStockThreshold: z.number().int().min(0).default(10),
  autoGenerateSlug: z.boolean().default(true),
  requireProductImage: z.boolean().default(true),
  allowNegativeStock: z.boolean().default(false),
  defaultTaxRate: z.number().min(0).max(100).default(0),
  enableReviews: z.boolean().default(true),
  requireReviewApproval: z.boolean().default(false),
});

export const shippingSettingsSchema = z.object({
  enableShipping: z.boolean().default(true),
  freeShippingThreshold: z.number().min(0).default(0),
  defaultShippingCost: z.number().min(0).default(0),
  shippingMethods: z.string().default('[]'),
});

export const paymentSettingsSchema = z.object({
  enablePayments: z.boolean().default(true),
  paymentMethods: z.string().default('[]'),
  currency: z.string().default('INR'),
  enableCOD: z.boolean().default(true),
  enableOnlinePayment: z.boolean().default(true),
});

export const emailSettingsSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().min(1).max(65535).optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpSecure: z.boolean().default(true),
  fromEmail: z.string().email('Invalid email address'),
  fromName: z.string().min(1, 'From name is required'),
});

export const seoSettingsSchema = z.object({
  siteTitle: z.string().min(1, 'Site title is required'),
  siteDescription: z.string().min(1, 'Site description is required'),
  siteKeywords: z.string().optional(),
  ogImage: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitterHandle: z.string().optional(),
  facebookUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  instagramUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

