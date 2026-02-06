/**
 * Order repository - Data access layer for orders
 */

import { prisma } from '@/src/infrastructure/database/prisma';
import { Order, CreateOrderData, UpdateOrderStatusData, OrderFilters, OrderSort } from '../types/order.types';
import { OrderStatus } from '@/src/shared/constants/order-status';
import { PaginationParams } from '@/src/shared/types/common.types';

export class OrderRepository {
  async findById(id: string): Promise<Order | null> {
    return prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                price: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        address: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    }) as Promise<Order | null>;
  }

  async findByUserId(
    userId: string,
    pagination?: PaginationParams
  ): Promise<{ orders: Order[]; total: number }> {
    const skip = pagination?.skip ?? 0;
    const take = pagination?.limit ?? 20;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  price: true,
                },
              },
            },
          },
          address: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return { orders: orders as Order[], total };
  }

  async findAll(
    filters?: OrderFilters,
    sort?: OrderSort,
    pagination?: PaginationParams
  ): Promise<{ orders: Order[]; total: number }> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    if (filters?.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
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
        { id: { contains: filters.search, mode: 'insensitive' } },
        { user: { name: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
        { orderItems: { some: { product: { name: { contains: filters.search, mode: 'insensitive' } } } } },
      ];
    }

    const orderBy: any = {};
    if (sort?.sortBy) {
      orderBy[sort.sortBy] = sort.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const skip = pagination?.skip ?? 0;
    const take = pagination?.limit ?? 20;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  price: true,
                },
              },
              variant: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
          address: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
      prisma.order.count({ where }),
    ]);

    return { orders: orders as Order[], total };
  }

  async create(data: CreateOrderData & {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    orderItems: Array<{ productId: string; variantId?: string | null; quantity: number; price: number }>;
  }): Promise<Order> {
    return prisma.order.create({
      data: {
        userId: data.userId,
        addressId: data.addressId,
        paymentMethod: data.paymentMethod,
        paymentId: data.paymentId,
        subtotal: data.subtotal,
        shipping: data.shipping,
        tax: data.tax,
        total: data.total,
        notes: data.notes,
        orderItems: {
          create: data.orderItems,
        },
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                price: true,
              },
            },
          },
        },
        address: true,
      },
    }) as Promise<Order>;
  }

  async updateStatus(id: string, data: UpdateOrderStatusData): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data: {
        status: data.status,
        paymentStatus: data.paymentStatus,
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                price: true,
              },
            },
          },
        },
        address: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    }) as Promise<Order>;
  }

  async update(id: string, data: Partial<Order>): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data: {
        status: data.status as any,
        paymentStatus: data.paymentStatus as any,
        paymentId: data.paymentId,
        notes: data.notes,
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                price: true,
              },
            },
          },
        },
        address: true,
      },
    }) as Promise<Order>;
  }
}

