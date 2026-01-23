/**
 * Settings service - Business logic for settings management
 */

import { SettingsRepository } from '../repositories/settings.repository';
import {
  Setting,
  CreateSettingData,
  UpdateSettingData,
  SettingGroup,
  GeneralSettings,
  ProductSettings,
  ShippingSettings,
  PaymentSettings,
  EmailSettings,
  SEOSettings,
} from '../types/settings.types';
import { NotFoundError } from '@/src/shared/utils/errors';

export class SettingsService {
  private settingsRepository: SettingsRepository;

  constructor() {
    this.settingsRepository = new SettingsRepository();
  }

  async getSetting(key: string): Promise<Setting | null> {
    return this.settingsRepository.findByKey(key);
  }

  async getSettingValue(key: string, defaultValue?: string): Promise<string> {
    const setting = await this.settingsRepository.findByKey(key);
    return setting?.value || defaultValue || '';
  }

  async getSettingsByGroup(group: SettingGroup): Promise<Setting[]> {
    return this.settingsRepository.findByGroup(group);
  }

  async getAllSettings(): Promise<Setting[]> {
    return this.settingsRepository.findAll();
  }

  async createSetting(data: CreateSettingData): Promise<Setting> {
    return this.settingsRepository.create(data);
  }

  async updateSetting(key: string, data: UpdateSettingData): Promise<Setting> {
    const existing = await this.settingsRepository.findByKey(key);
    if (!existing) {
      throw new NotFoundError('Setting');
    }
    return this.settingsRepository.update(key, data);
  }

  async upsertSetting(data: CreateSettingData): Promise<Setting> {
    return this.settingsRepository.upsert(data.key, data);
  }

  async bulkUpdateSettings(settings: Array<{ key: string; value: string; group: SettingGroup }>): Promise<void> {
    await this.settingsRepository.bulkUpsert(settings);
  }

  // Helper methods to get/set grouped settings
  async getGeneralSettings(): Promise<GeneralSettings> {
    const settings = await this.settingsRepository.findByGroup('general');
    const getValue = (key: string, defaultValue: string) => {
      const setting = settings.find((s) => s.key === key);
      return setting?.value || defaultValue;
    };

    return {
      storeName: getValue('storeName', 'Nextin Jewellery'),
      storeEmail: getValue('storeEmail', 'support@nextinjewellery.com'),
      storePhone: getValue('storePhone', ''),
      storeAddress: getValue('storeAddress', ''),
      storeCity: getValue('storeCity', ''),
      storeState: getValue('storeState', ''),
      storeCountry: getValue('storeCountry', 'India'),
      storePostalCode: getValue('storePostalCode', ''),
      currency: getValue('currency', 'INR'),
      timezone: getValue('timezone', 'Asia/Kolkata'),
      language: getValue('language', 'en'),
    };
  }

  async saveGeneralSettings(data: GeneralSettings): Promise<void> {
    await this.settingsRepository.bulkUpsert([
      { key: 'storeName', value: data.storeName, group: 'general' },
      { key: 'storeEmail', value: data.storeEmail, group: 'general' },
      { key: 'storePhone', value: data.storePhone || '', group: 'general' },
      { key: 'storeAddress', value: data.storeAddress || '', group: 'general' },
      { key: 'storeCity', value: data.storeCity || '', group: 'general' },
      { key: 'storeState', value: data.storeState || '', group: 'general' },
      { key: 'storeCountry', value: data.storeCountry, group: 'general' },
      { key: 'storePostalCode', value: data.storePostalCode || '', group: 'general' },
      { key: 'currency', value: data.currency, group: 'general' },
      { key: 'timezone', value: data.timezone, group: 'general' },
      { key: 'language', value: data.language, group: 'general' },
    ]);
  }

  async getProductSettings(): Promise<ProductSettings> {
    const settings = await this.settingsRepository.findByGroup('product');
    const getValue = (key: string, defaultValue: string | number | boolean) => {
      const setting = settings.find((s) => s.key === key);
      if (!setting) return defaultValue;
      if (typeof defaultValue === 'boolean') return setting.value === 'true';
      if (typeof defaultValue === 'number') return parseFloat(setting.value) || defaultValue;
      return setting.value;
    };

    return {
      defaultStockThreshold: getValue('defaultStockThreshold', 10) as number,
      autoGenerateSlug: getValue('autoGenerateSlug', true) as boolean,
      requireProductImage: getValue('requireProductImage', true) as boolean,
      allowNegativeStock: getValue('allowNegativeStock', false) as boolean,
      defaultTaxRate: getValue('defaultTaxRate', 0) as number,
      enableReviews: getValue('enableReviews', true) as boolean,
      requireReviewApproval: getValue('requireReviewApproval', false) as boolean,
    };
  }

  async saveProductSettings(data: ProductSettings): Promise<void> {
    await this.settingsRepository.bulkUpsert([
      { key: 'defaultStockThreshold', value: data.defaultStockThreshold.toString(), group: 'product' },
      { key: 'autoGenerateSlug', value: data.autoGenerateSlug.toString(), group: 'product' },
      { key: 'requireProductImage', value: data.requireProductImage.toString(), group: 'product' },
      { key: 'allowNegativeStock', value: data.allowNegativeStock.toString(), group: 'product' },
      { key: 'defaultTaxRate', value: data.defaultTaxRate.toString(), group: 'product' },
      { key: 'enableReviews', value: data.enableReviews.toString(), group: 'product' },
      { key: 'requireReviewApproval', value: data.requireReviewApproval.toString(), group: 'product' },
    ]);
  }

  async getShippingSettings(): Promise<ShippingSettings> {
    const settings = await this.settingsRepository.findByGroup('shipping');
    const getValue = (key: string, defaultValue: string | number | boolean) => {
      const setting = settings.find((s) => s.key === key);
      if (!setting) return defaultValue;
      if (typeof defaultValue === 'boolean') return setting.value === 'true';
      if (typeof defaultValue === 'number') return parseFloat(setting.value) || defaultValue;
      return setting.value;
    };

    return {
      enableShipping: getValue('enableShipping', true) as boolean,
      freeShippingThreshold: getValue('freeShippingThreshold', 0) as number,
      defaultShippingCost: getValue('defaultShippingCost', 0) as number,
      shippingMethods: getValue('shippingMethods', '[]') as string,
    };
  }

  async saveShippingSettings(data: ShippingSettings): Promise<void> {
    await this.settingsRepository.bulkUpsert([
      { key: 'enableShipping', value: data.enableShipping.toString(), group: 'shipping' },
      { key: 'freeShippingThreshold', value: data.freeShippingThreshold.toString(), group: 'shipping' },
      { key: 'defaultShippingCost', value: data.defaultShippingCost.toString(), group: 'shipping' },
      { key: 'shippingMethods', value: data.shippingMethods, group: 'shipping' },
    ]);
  }

  async getPaymentSettings(): Promise<PaymentSettings> {
    const settings = await this.settingsRepository.findByGroup('payment');
    const getValue = (key: string, defaultValue: string | boolean) => {
      const setting = settings.find((s) => s.key === key);
      if (!setting) return defaultValue;
      if (typeof defaultValue === 'boolean') return setting.value === 'true';
      return setting.value;
    };

    return {
      enablePayments: getValue('enablePayments', true) as boolean,
      paymentMethods: getValue('paymentMethods', '[]') as string,
      currency: getValue('currency', 'INR') as string,
      enableCOD: getValue('enableCOD', true) as boolean,
      enableOnlinePayment: getValue('enableOnlinePayment', true) as boolean,
    };
  }

  async savePaymentSettings(data: PaymentSettings): Promise<void> {
    await this.settingsRepository.bulkUpsert([
      { key: 'enablePayments', value: data.enablePayments.toString(), group: 'payment' },
      { key: 'paymentMethods', value: data.paymentMethods, group: 'payment' },
      { key: 'currency', value: data.currency, group: 'payment' },
      { key: 'enableCOD', value: data.enableCOD.toString(), group: 'payment' },
      { key: 'enableOnlinePayment', value: data.enableOnlinePayment.toString(), group: 'payment' },
    ]);
  }

  async getEmailSettings(): Promise<EmailSettings> {
    const settings = await this.settingsRepository.findByGroup('email');
    const getValue = (key: string, defaultValue: string | number | boolean) => {
      const setting = settings.find((s) => s.key === key);
      if (!setting) return defaultValue;
      if (typeof defaultValue === 'boolean') return setting.value === 'true';
      if (typeof defaultValue === 'number') return parseInt(setting.value) || defaultValue;
      return setting.value;
    };

    return {
      smtpHost: getValue('smtpHost', '') as string,
      smtpPort: getValue('smtpPort', 587) as number,
      smtpUser: getValue('smtpUser', '') as string,
      smtpPassword: getValue('smtpPassword', '') as string,
      smtpSecure: getValue('smtpSecure', true) as boolean,
      fromEmail: getValue('fromEmail', 'noreply@nextinjewellery.com') as string,
      fromName: getValue('fromName', 'Nextin Jewellery') as string,
    };
  }

  async saveEmailSettings(data: EmailSettings): Promise<void> {
    await this.settingsRepository.bulkUpsert([
      { key: 'smtpHost', value: data.smtpHost || '', group: 'email' },
      { key: 'smtpPort', value: (data.smtpPort || 587).toString(), group: 'email' },
      { key: 'smtpUser', value: data.smtpUser || '', group: 'email' },
      { key: 'smtpPassword', value: data.smtpPassword || '', group: 'email' },
      { key: 'smtpSecure', value: data.smtpSecure.toString(), group: 'email' },
      { key: 'fromEmail', value: data.fromEmail, group: 'email' },
      { key: 'fromName', value: data.fromName, group: 'email' },
    ]);
  }

  async getSEOSettings(): Promise<SEOSettings> {
    const settings = await this.settingsRepository.findByGroup('seo');
    const getValue = (key: string, defaultValue: string) => {
      const setting = settings.find((s) => s.key === key);
      return setting?.value || defaultValue;
    };

    return {
      siteTitle: getValue('siteTitle', 'Nextin Jewellery'),
      siteDescription: getValue('siteDescription', 'Premium Jewellery Store'),
      siteKeywords: getValue('siteKeywords', ''),
      ogImage: getValue('ogImage', ''),
      twitterHandle: getValue('twitterHandle', ''),
      facebookUrl: getValue('facebookUrl', ''),
      instagramUrl: getValue('instagramUrl', ''),
    };
  }

  async saveSEOSettings(data: SEOSettings): Promise<void> {
    await this.settingsRepository.bulkUpsert([
      { key: 'siteTitle', value: data.siteTitle, group: 'seo' },
      { key: 'siteDescription', value: data.siteDescription, group: 'seo' },
      { key: 'siteKeywords', value: data.siteKeywords || '', group: 'seo' },
      { key: 'ogImage', value: data.ogImage || '', group: 'seo' },
      { key: 'twitterHandle', value: data.twitterHandle || '', group: 'seo' },
      { key: 'facebookUrl', value: data.facebookUrl || '', group: 'seo' },
      { key: 'instagramUrl', value: data.instagramUrl || '', group: 'seo' },
    ]);
  }
}

