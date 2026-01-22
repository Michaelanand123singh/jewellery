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
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
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

