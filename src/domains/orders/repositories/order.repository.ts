/**
 * Order repository - Data access layer for orders
 */

import { prisma } from '@/src/infrastructure/database/prisma';
import { Order, CreateOrderData, UpdateOrderStatusData } from '../types/order.types';
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
          },
        },
        address: true,
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

  async findAll(pagination?: PaginationParams): Promise<{ orders: Order[]; total: number }> {
    const skip = pagination?.skip ?? 0;
    const take = pagination?.limit ?? 20;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
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
      prisma.order.count(),
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

