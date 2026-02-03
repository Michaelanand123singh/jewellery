/**
 * Order domain types
 */

import { OrderStatus } from '@/src/shared/constants/order-status';
import { PaymentMethod, PaymentStatus } from '@/src/shared/constants/payment-methods';

export interface Order {
  id: string;
  userId: string;
  addressId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentId?: string | null;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  orderItems: OrderItem[];
  address?: Address;
  user?: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  price: number;
  product?: Product;
  variant?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CreateOrderData {
  userId: string;
  addressId: string;
  paymentMethod: PaymentMethod;
  paymentId?: string;
  notes?: string;
}

export interface UpdateOrderStatusData {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
}

export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  startDate?: Date;
  endDate?: Date;
  search?: string; // Search by order ID, customer name, email, or product name
  userId?: string;
}

export interface OrderSort {
  sortBy?: 'createdAt' | 'total' | 'status' | 'paymentStatus';
  sortOrder?: 'asc' | 'desc';
}

