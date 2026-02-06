/**
 * User service - Business logic for user management
 */

import { UserRepository } from '../../auth/repositories/user.repository';
import { UserFilters, UserSort, UpdateUserData, UserStats } from '../types/user.types';
import { PaginationParams } from '@/src/shared/types/common.types';
import { NotFoundError, ValidationError } from '@/src/shared/utils/errors';
import { prisma } from '@/src/infrastructure/database/prisma';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findByIdWithDetails(id);
    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  }

  async getAllUsers(
    filters?: UserFilters,
    sort?: UserSort,
    pagination?: PaginationParams
  ) {
    const { users, total } = await this.userRepository.findAll(filters, sort, pagination);
    const limit = pagination?.limit ?? 20;
    const totalPages = Math.ceil(total / limit);

    return { users, total, totalPages };
  }

  /**
   * Get all users for export with optimized batch queries
   * This method uses batch aggregation instead of per-user queries for better performance
   */
  async getAllUsersForExport(filters?: UserFilters, sort?: UserSort) {
    const { users } = await this.userRepository.findAllForExport(filters, sort);
    return users;
  }

  async updateUser(id: string, data: UpdateUserData) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Validate role if provided
    if (data.role && !['USER', 'ADMIN'].includes(data.role)) {
      throw new ValidationError('Invalid role. Must be USER or ADMIN');
    }

    return this.userRepository.update(id, data);
  }

  async deleteUser(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Prevent deleting the last admin
    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        throw new ValidationError('Cannot delete the last admin user');
      }
    }

    await this.userRepository.delete(id);
  }

  async getUserStats(): Promise<UserStats> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      totalAdmins,
      totalCustomers,
      roleBreakdown,
      providerBreakdown,
      usersWithOrders,
      topCustomersRaw,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: startOfWeek } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      }),
      prisma.user.groupBy({
        by: ['provider'],
        _count: { id: true },
      }),
      prisma.user.count({
        where: { orders: { some: {} } },
      }),
      prisma.user.findMany({
        where: {
          orders: {
            some: {
              status: {
                in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'],
              },
            },
          },
        },
        include: {
          _count: {
            select: { orders: true },
          },
        },
        take: 10,
      }),
    ]);

    // Calculate total spent for top customers
    const topCustomers = await Promise.all(
      topCustomersRaw.map(async (user) => {
        const totalSpentResult = await prisma.order.aggregate({
          where: {
            userId: user.id,
            status: {
              in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'],
            },
          },
          _sum: { total: true },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          totalSpent: totalSpentResult._sum.total || 0,
          orderCount: user._count.orders,
        };
      })
    );

    // Sort by total spent descending
    topCustomers.sort((a, b) => b.totalSpent - a.totalSpent);

    const roleBreakdownMap: Record<string, number> = {};
    roleBreakdown.forEach((item) => {
      roleBreakdownMap[item.role] = item._count.id;
    });

    const providerBreakdownMap: Record<string, number> = {};
    providerBreakdown.forEach((item) => {
      providerBreakdownMap[item.provider] = item._count.id;
    });

    return {
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      totalAdmins,
      totalCustomers,
      usersWithOrders,
      usersWithoutOrders: totalUsers - usersWithOrders,
      roleBreakdown: roleBreakdownMap,
      providerBreakdown: providerBreakdownMap,
      topCustomers: topCustomers.slice(0, 10),
    };
  }
}

