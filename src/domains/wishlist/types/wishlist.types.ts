/**
 * Wishlist domain types
 */

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: Date;
  product: Product;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  description?: string | null;
  category: string;
  inStock: boolean;
  rating?: number | null;
}

