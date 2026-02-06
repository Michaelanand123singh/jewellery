/**
 * User repository - Data access layer for users
 */

import { prisma } from '@/src/infrastructure/database/prisma';
import { User } from '../types/auth.types';
import { UserFilters, UserSort } from '@/src/domains/users/types/user.types';
import { PaginationParams } from '@/src/shared/types/common.types';

export class UserRepository {
  async findByEmail(email: string): Promise<(User & { password: string | null; provider: string; providerId: string | null }) | null> {
    return prisma.user.findUnique({
      where: { email },
    }) as Promise<(User & { password: string | null; provider: string; providerId: string | null }) | null>;
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByIdWithDetails(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
            addresses: true,
            cartItems: true,
            wishlistItems: true,
            reviews: true,
          },
        },
        orders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) return null;

    // Calculate total spent
    const totalSpentResult = await prisma.order.aggregate({
      where: {
        userId: id,
        status: {
          in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'],
        },
      },
      _sum: {
        total: true,
      },
    });

    return {
      ...user,
      totalSpent: totalSpentResult._sum.total || 0,
      lastOrderDate: user.orders[0]?.createdAt || null,
    };
  }

  async findAll(
    filters?: UserFilters,
    sort?: UserSort,
    pagination?: PaginationParams
  ) {
    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.provider) {
      where.provider = filters.provider;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.hasOrders !== undefined) {
      if (filters.hasOrders) {
        where.orders = { some: {} };
      } else {
        where.orders = { none: {} };
      }
    }

    const orderBy: any = {};
    if (sort?.sortBy === 'orderCount' || sort?.sortBy === 'totalSpent') {
      // These need special handling via aggregation
      orderBy.createdAt = sort.sortOrder || 'desc';
    } else if (sort?.sortBy === 'name') {
      orderBy.name = sort.sortOrder || 'asc';
    } else if (sort?.sortBy === 'email') {
      orderBy.email = sort.sortOrder || 'asc';
    } else {
      orderBy.createdAt = sort?.sortOrder || 'desc';
    }

    const skip = pagination?.skip ?? 0;
    const take = pagination?.limit ?? 20;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          _count: {
            select: {
              orders: true,
              addresses: true,
              cartItems: true,
              wishlistItems: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate total spent and order counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [totalSpentResult, lastOrder] = await Promise.all([
          prisma.order.aggregate({
            where: {
              userId: user.id,
              status: {
                in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'],
              },
            },
            _sum: {
              total: true,
            },
          }),
          prisma.order.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          }),
        ]);

        return {
          ...user,
          totalSpent: totalSpentResult._sum.total || 0,
          lastOrderDate: lastOrder?.createdAt || null,
        };
      })
    );

    return { users: usersWithStats, total };
  }

  /**
   * Find all users for export with optimized batch aggregation
   * Uses batch queries instead of per-user queries for better performance
   */
  async findAllForExport(filters?: UserFilters, sort?: UserSort) {
    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.provider) {
      where.provider = filters.provider;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.hasOrders !== undefined) {
      if (filters.hasOrders) {
        where.orders = { some: {} };
      } else {
        where.orders = { none: {} };
      }
    }

    const orderBy: any = {};
    if (sort?.sortBy === 'name') {
      orderBy.name = sort.sortOrder || 'asc';
    } else if (sort?.sortBy === 'email') {
      orderBy.email = sort.sortOrder || 'asc';
    } else {
      orderBy.createdAt = sort?.sortOrder || 'desc';
    }

    // Fetch all users with counts (no pagination for export)
    const users = await prisma.user.findMany({
      where,
      orderBy,
      include: {
        _count: {
          select: {
            orders: true,
            addresses: true,
            cartItems: true,
            wishlistItems: true,
            reviews: true,
          },
        },
      },
    });

    // Batch aggregate total spent for all users at once
    const userIds = users.map((u) => u.id);
    const totalSpentMap = new Map<string, number>();

    if (userIds.length > 0) {
      // Use groupBy to get total spent for all users in one query
      const orderTotals = await prisma.order.groupBy({
        by: ['userId'],
        where: {
          userId: { in: userIds },
          status: {
            in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'],
          },
        },
        _sum: {
          total: true,
        },
      });

      // Build map of userId -> totalSpent
      orderTotals.forEach((item) => {
        totalSpentMap.set(item.userId, item._sum.total || 0);
      });
    }

    // Map users with their total spent
    const usersWithStats = users.map((user) => ({
      ...user,
      totalSpent: totalSpentMap.get(user.id) || 0,
      lastOrderDate: null, // Not needed for export
    }));

    // Sort by totalSpent if needed (after aggregation)
    if (sort?.sortBy === 'totalSpent') {
      usersWithStats.sort((a, b) => {
        const diff = b.totalSpent - a.totalSpent;
        return sort.sortOrder === 'asc' ? -diff : diff;
      });
    } else if (sort?.sortBy === 'orderCount') {
      usersWithStats.sort((a, b) => {
        const diff = (b._count.orders || 0) - (a._count.orders || 0);
        return sort.sortOrder === 'asc' ? -diff : diff;
      });
    }

    return { users: usersWithStats, total: usersWithStats.length };
  }

  async create(data: {
    email: string;
    password?: string | null;
    name?: string;
    phone?: string;
    role?: string;
    provider?: string;
    providerId?: string | null;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        password: data.password || null,
        name: data.name,
        phone: data.phone,
        role: data.role || 'USER',
        provider: data.provider || 'local',
        providerId: data.providerId || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(
    id: string,
    data: Partial<Pick<User, 'name' | 'phone' | 'role'>>
  ): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }
}

