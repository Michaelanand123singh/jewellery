/**
 * Order service - Business logic for orders
 */

import { OrderRepository } from '../repositories/order.repository';
import { ProductRepository } from '@/src/domains/products/repositories/product.repository';
import { CartRepository } from '@/src/domains/cart/repositories/cart.repository';
import {
  Order,
  CreateOrderData,
  UpdateOrderStatusData,
} from '../types/order.types';
import { PaginationParams } from '@/src/shared/types/common.types';
import { NotFoundError, ValidationError } from '@/src/shared/utils/errors';
import { OrderStatus } from '@/src/shared/constants/order-status';
import { canTransitionOrder } from '@/src/shared/constants/order-status';
import { prisma } from '@/src/infrastructure/database/prisma';

export class OrderService {
  private orderRepository: OrderRepository;
  private productRepository: ProductRepository;
  private cartRepository: CartRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
    this.productRepository = new ProductRepository();
    this.cartRepository = new CartRepository();
  }

  async getOrderById(id: string, userId?: string): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Order');
    }

    // If userId provided, ensure order belongs to user
    if (userId && order.userId !== userId) {
      throw new NotFoundError('Order');
    }

    return order;
  }

  async getOrdersByUserId(
    userId: string,
    pagination?: PaginationParams
  ): Promise<{ orders: Order[]; total: number; totalPages: number }> {
    const { orders, total } = await this.orderRepository.findByUserId(userId, pagination);
    const limit = pagination?.limit ?? 20;
    const totalPages = Math.ceil(total / limit);

    return { orders, total, totalPages };
  }

  async getAllOrders(
    pagination?: PaginationParams
  ): Promise<{ orders: Order[]; total: number; totalPages: number }> {
    const { orders, total } = await this.orderRepository.findAll(pagination);
    const limit = pagination?.limit ?? 20;
    const totalPages = Math.ceil(total / limit);

    return { orders, total, totalPages };
  }

  async createOrder(data: CreateOrderData): Promise<Order> {
    // Get user's cart items
    const cartItems = await this.cartRepository.findByUserId(data.userId);

    if (cartItems.length === 0) {
      throw new ValidationError('Cart is empty');
    }

    // Validate stock and calculate totals
    let subtotal = 0;
    const orderItems: Array<{ productId: string; quantity: number; price: number }> = [];

    for (const item of cartItems) {
      const product = item.product;
      
      if (!product.inStock || product.stockQuantity < item.quantity) {
        throw new ValidationError(
          `${product.name} is out of stock or insufficient quantity`
        );
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Calculate shipping and tax
    const shipping = subtotal > 499 ? 0 : 50; // Free shipping over ₹499
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + shipping + tax;

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId: data.userId,
          addressId: data.addressId,
          paymentMethod: data.paymentMethod,
          paymentId: data.paymentId,
          subtotal,
          shipping,
          tax,
          total,
          notes: data.notes,
          orderItems: {
            create: orderItems,
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
      });

      // Update product stock
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
            inStock: {
              set: item.product.stockQuantity - item.quantity > 0,
            },
          },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { userId: data.userId },
      });

      return newOrder;
    });

    return order as Order;
  }

  async updateOrderStatus(
    id: string,
    data: UpdateOrderStatusData
  ): Promise<Order> {
    const order = await this.getOrderById(id);

    // Validate status transition
    if (data.status && !canTransitionOrder(order.status, data.status)) {
      throw new ValidationError(
        `Cannot transition order from ${order.status} to ${data.status}`
      );
    }

    return this.orderRepository.updateStatus(id, data);
  }
}

