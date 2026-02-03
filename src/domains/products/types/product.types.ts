/**
 * Product domain types
 */

export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ProductDimensions {
  length?: number;
  width?: number;
  height?: number;
  unit?: string; // 'cm', 'inch', etc.
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  image: string;
  images: string[];
  category: string; // Legacy: kept for backward compatibility
  categoryId?: string | null; // New: FK to Category
  status: ProductStatus;
  inStock: boolean;
  stockQuantity: number;
  rating?: number | null;
  reviewCount: number;
  
  // SEO fields
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords: string[];
  ogImage?: string | null;
  
  // Physical attributes
  weight?: number | null; // in grams
  dimensions?: ProductDimensions | null;
  taxClass?: string | null;
  
  // Supplier information
  supplierName?: string | null;
  supplierLocation?: string | null;
  supplierCertification?: string | null;
  
  // Return policy
  returnPolicy?: string | null;
  returnDays?: number | null;
  
  // Relations
  brandId?: string | null;
  brand?: Brand | null;
  variants?: ProductVariant[];
  attributes?: ProductAttribute[];
  tags?: ProductTag[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductData {
  name: string;
  slug: string;
  sku?: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category?: string; // Legacy: kept for backward compatibility
  categoryId?: string; // New: FK to Category
  status?: ProductStatus;
  inStock?: boolean;
  stockQuantity?: number;
  
  // SEO fields
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string;
  
  // Physical attributes
  weight?: number;
  dimensions?: ProductDimensions;
  taxClass?: string;
  
  // Supplier information
  supplierName?: string;
  supplierLocation?: string;
  supplierCertification?: string;
  
  // Return policy
  returnPolicy?: string;
  returnDays?: number;
  
  // Relations
  brandId?: string;
  tagIds?: string[];
  attributes?: Array<{ key: string; value: string }>;
}

export interface UpdateProductData {
  name?: string;
  slug?: string;
  sku?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  image?: string;
  images?: string[];
  category?: string; // Legacy
  categoryId?: string; // New
  status?: ProductStatus;
  inStock?: boolean;
  stockQuantity?: number;
  
  // SEO fields
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string;
  
  // Physical attributes
  weight?: number;
  dimensions?: ProductDimensions;
  taxClass?: string;
  
  // Supplier information
  supplierName?: string;
  supplierLocation?: string;
  supplierCertification?: string;
  
  // Return policy
  returnPolicy?: string;
  returnDays?: number;
  
  // Relations
  brandId?: string;
  tagIds?: string[];
  attributes?: Array<{ key: string; value: string }>;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  rating?: number;
}

export interface ProductSort {
  sortBy?: 'price' | 'name' | 'rating' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
}

// Product Variant types
export interface ProductVariantAttributes {
  size?: string;
  color?: string;
  material?: string;
  [key: string]: string | undefined;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price?: number | null;
  stockQuantity: number;
  attributes: ProductVariantAttributes;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductVariantData {
  productId: string;
  sku: string;
  name: string;
  price?: number;
  stockQuantity?: number;
  attributes: ProductVariantAttributes;
  image?: string;
}

export interface UpdateProductVariantData {
  sku?: string;
  name?: string;
  price?: number;
  stockQuantity?: number;
  attributes?: ProductVariantAttributes;
  image?: string;
}

// Product Attribute types
export interface ProductAttribute {
  id: string;
  productId: string;
  key: string;
  value: string;
  createdAt: Date;
}

// Brand types
export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBrandData {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
}

export interface UpdateBrandData {
  name?: string;
  slug?: string;
  logo?: string;
  description?: string;
}

// Product Tag types
export interface ProductTag {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductTagData {
  name: string;
  slug: string;
}

export interface UpdateProductTagData {
  name?: string;
  slug?: string;
}

