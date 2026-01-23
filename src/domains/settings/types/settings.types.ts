/**
 * Settings domain types
 */

export type SettingType = 'string' | 'number' | 'boolean' | 'json';
export type SettingGroup = 'general' | 'product' | 'shipping' | 'payment' | 'email' | 'seo' | 'tax';

export interface Setting {
  id: string;
  key: string;
  value: string;
  type: SettingType;
  group: SettingGroup;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSettingData {
  key: string;
  value: string;
  type?: SettingType;
  group: SettingGroup;
  description?: string;
}

export interface UpdateSettingData {
  value?: string;
  type?: SettingType;
  description?: string;
}

export interface SettingsGroup {
  group: SettingGroup;
  settings: Setting[];
}

export interface GeneralSettings {
  storeName: string;
  storeEmail: string;
  storePhone?: string;
  storeAddress?: string;
  storeCity?: string;
  storeState?: string;
  storeCountry: string;
  storePostalCode?: string;
  currency: string;
  timezone: string;
  language: string;
}

export interface ProductSettings {
  defaultStockThreshold: number;
  autoGenerateSlug: boolean;
  requireProductImage: boolean;
  allowNegativeStock: boolean;
  defaultTaxRate: number;
  enableReviews: boolean;
  requireReviewApproval: boolean;
}

export interface ShippingSettings {
  enableShipping: boolean;
  freeShippingThreshold: number;
  defaultShippingCost: number;
  shippingMethods: string; // JSON string
}

export interface PaymentSettings {
  enablePayments: boolean;
  paymentMethods: string; // JSON string
  currency: string;
  enableCOD: boolean;
  enableOnlinePayment: boolean;
}

export interface EmailSettings {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure: boolean;
  fromEmail: string;
  fromName: string;
}

export interface SEOSettings {
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string;
  ogImage?: string;
  twitterHandle?: string;
  facebookUrl?: string;
  instagramUrl?: string;
}

