/**
 * Cart domain types
 */

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  product: Product;
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

export interface AddToCartData {
  userId: string;
  productId: string;
  quantity: number;
}

export interface UpdateCartItemData {
  quantity: number;
}

