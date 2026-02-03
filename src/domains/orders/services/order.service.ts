/**
 * Order service - Business logic for orders
 */

import { OrderRepository } from '../repositories/order.repository';
import { ProductRepository } from '@/src/domains/products/repositories/product.repository';
import { ProductVariantRepository } from '@/src/domains/products/repositories/variant.repository';
import { InventoryRepository } from '@/src/domains/inventory/repositories/inventory.repository';
import { CartRepository } from '@/src/domains/cart/repositories/cart.repository';
import {
  Order,
  CreateOrderData,
  UpdateOrderStatusData,
  OrderFilters,
  OrderSort,
} from '../types/order.types';
import { PaginationParams } from '@/src/shared/types/common.types';
import { NotFoundError, ValidationError } from '@/src/shared/utils/errors';
import { OrderStatus } from '@/src/shared/constants/order-status';
import { canTransitionOrder } from '@/src/shared/constants/order-status';
import { prisma } from '@/src/infrastructure/database/prisma';

export class OrderService {
  private orderRepository: OrderRepository;
  private productRepository: ProductRepository;
  private variantRepository: ProductVariantRepository;
  private inventoryRepository: InventoryRepository;
  private cartRepository: CartRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
    this.productRepository = new ProductRepository();
    this.variantRepository = new ProductVariantRepository();
    this.inventoryRepository = new InventoryRepository();
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
    filters?: OrderFilters,
    sort?: OrderSort,
    pagination?: PaginationParams
  ): Promise<{ orders: Order[]; total: number; totalPages: number }> {
    const { orders, total } = await this.orderRepository.findAll(filters, sort, pagination);
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
    const orderItems: Array<{ productId: string; variantId?: string | null; quantity: number; price: number }> = [];

    for (const item of cartItems) {
      const product = item.product;
      
      // If variant exists, check variant stock
      if (item.variantId && item.variant) {
        if (item.variant.stockQuantity < item.quantity) {
          throw new ValidationError(
            `${product.name} - ${item.variant.name} is out of stock or insufficient quantity`
          );
        }
        
        // Use variant price if available, otherwise product price
        const price = item.variant.price ?? product.price;
        const itemTotal = price * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          productId: product.id,
          variantId: item.variantId,
          quantity: item.quantity,
          price,
        });
      } else {
        // No variant - check product stock
        if (!product.inStock || product.stockQuantity < item.quantity) {
          throw new ValidationError(
            `${product.name} is out of stock or insufficient quantity`
          );
        }

        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          productId: product.id,
          variantId: null,
          quantity: item.quantity,
          price: product.price,
        });
      }
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

      // Update stock - handle variants and products
      for (const item of cartItems) {
        // If variant exists, deduct variant stock
        if (item.variantId && item.variant) {
          const previousVariantStock = item.variant.stockQuantity;
          const newVariantStock = previousVariantStock - item.quantity;

          // Update variant stock
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stockQuantity: newVariantStock,
            },
          });

          // Create stock movement for variant
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              variantId: item.variantId,
              type: 'OUT',
              quantity: -item.quantity, // Negative for OUT
              previousStock: previousVariantStock,
              newStock: newVariantStock,
              reason: 'Order created',
              referenceId: newOrder.id,
              referenceType: 'ORDER',
            },
          });

          // Sync product stock from variants (sum of all variant stocks)
          const allVariants = await tx.productVariant.findMany({
            where: { productId: item.productId },
          });
          const totalVariantStock = allVariants.reduce(
            (sum, v) => sum + v.stockQuantity,
            0
          );

          // Update product stock to match sum of variants
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: totalVariantStock,
              inStock: totalVariantStock > 0,
            },
          });
        } else {
          // No variant - deduct product stock directly
          const previousProductStock = item.product.stockQuantity;
          const newProductStock = previousProductStock - item.quantity;

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: newProductStock,
              inStock: newProductStock > 0,
            },
          });

          // Create stock movement for product
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              variantId: null,
              type: 'OUT',
              quantity: -item.quantity, // Negative for OUT
              previousStock: previousProductStock,
              newStock: newProductStock,
              reason: 'Order created',
              referenceId: newOrder.id,
              referenceType: 'ORDER',
            },
          });
        }
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

