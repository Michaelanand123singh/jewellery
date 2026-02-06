/**
 * Cart domain types
 */

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  product: Product;
  variant?: ProductVariant | null;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  inStock: boolean;
  stockQuantity: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price?: number | null;
  stockQuantity: number;
  attributes: any;
  image?: string | null;
}

export interface AddToCartData {
  userId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface UpdateCartItemData {
  quantity: number;
}

