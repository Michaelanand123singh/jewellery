/**
 * User domain types
 */

import { User as AuthUser } from '../../auth/types/auth.types';

export interface User extends AuthUser {
  provider?: string;
  providerId?: string | null;
  _count?: {
    orders: number;
    addresses: number;
    cartItems: number;
    wishlistItems: number;
    reviews: number;
  };
  totalSpent?: number;
  lastOrderDate?: Date | null;
}

export interface UserFilters {
  role?: string;
  provider?: string;
  search?: string; // Search by name, email, phone
  startDate?: Date;
  endDate?: Date;
  hasOrders?: boolean;
  minOrders?: number;
  maxOrders?: number;
}

export interface UserSort {
  sortBy?: 'createdAt' | 'name' | 'email' | 'totalSpent' | 'orderCount';
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  role?: string;
}

export interface UserStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalAdmins: number;
  totalCustomers: number;
  usersWithOrders: number;
  usersWithoutOrders: number;
  roleBreakdown: Record<string, number>;
  providerBreakdown: Record<string, number>;
  topCustomers: Array<{
    id: string;
    name: string | null;
    email: string;
    totalSpent: number;
    orderCount: number;
  }>;
}

