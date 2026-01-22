/**
 * Product domain types
 */

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  image: string;
  images: string[];
  category: string;
  inStock: boolean;
  stockQuantity: number;
  rating?: number | null;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductData {
  name: string;
  slug: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category: string;
  inStock: boolean;
  stockQuantity: number;
}

export interface UpdateProductData {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  image?: string;
  images?: string[];
  category?: string;
  inStock?: boolean;
  stockQuantity?: number;
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

