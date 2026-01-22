/**
 * Review domain types
 */

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment?: string | null;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  product?: Product;
}

export interface User {
  id: string;
  name: string | null;
  email: string;
}

export interface Product {
  id: string;
  name: string;
}

export interface CreateReviewData {
  userId: string;
  productId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
}

