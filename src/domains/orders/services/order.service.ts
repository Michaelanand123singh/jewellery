/**
 * Order service - Business logic for orders
 */

import { OrderRepository } from '../repositories/order.repository';
import { ProductRepository } from '@/src/domains/products/repositories/product.repository';
import { ProductVariantRepository } from '@/src/domains/products/repositories/variant.repository';
import { InventoryRepository } from '@/src/domains/inventory/repositories/inventory.repository';
import { CartRepository } from '@/src/domains/cart/repositories/cart.repository';
import { UserRepository } from '@/src/domains/auth/repositories/user.repository';
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
import { EmailService } from '@/src/shared/services/email.service';
import { EmailTemplatesService } from '@/src/shared/services/email-templates.service';
import { logger } from '@/src/shared/utils/logger';

export class OrderService {
  private orderRepository: OrderRepository;
  private productRepository: ProductRepository;
  private variantRepository: ProductVariantRepository;
  private inventoryRepository: InventoryRepository;
  private cartRepository: CartRepository;
  private userRepository: UserRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
    this.productRepository = new ProductRepository();
    this.variantRepository = new ProductVariantRepository();
    this.inventoryRepository = new InventoryRepository();
    this.cartRepository = new CartRepository();
    this.userRepository = new UserRepository();
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

    // Transform product image URLs in order items
    return this.transformOrderImages(order);
  }

  async getOrdersByUserId(
    userId: string,
    pagination?: PaginationParams
  ): Promise<{ orders: Order[]; total: number; totalPages: number }> {
    const { orders, total } = await this.orderRepository.findByUserId(userId, pagination);
    const limit = pagination?.limit ?? 20;
    const totalPages = Math.ceil(total / limit);

    // Transform product image URLs in all orders
    const transformedOrders = orders.map(order => this.transformOrderImages(order));

    return { orders: transformedOrders, total, totalPages };
  }

  async getAllOrders(
    filters?: OrderFilters,
    sort?: OrderSort,
    pagination?: PaginationParams
  ): Promise<{ orders: Order[]; total: number; totalPages: number }> {
    const { orders, total } = await this.orderRepository.findAll(filters, sort, pagination);
    const limit = pagination?.limit ?? 20;
    const totalPages = Math.ceil(total / limit);

    // Transform product image URLs in all orders
    const transformedOrders = orders.map(order => this.transformOrderImages(order));

    return { orders: transformedOrders, total, totalPages };
  }

  /**
   * Transform product image URLs in order items to use proxy
   */
  private transformOrderImages(order: Order): Order {
    return {
      ...order,
      orderItems: order.orderItems.map(item => ({
        ...item,
        product: item.product ? {
          ...item.product,
          image: item.product.image ? this.transformImageUrl(item.product.image) : item.product.image,
        } : item.product,
      })),
    };
  }

  /**
   * Transform image URL to use proxy for frontend access
   */
  private transformImageUrl(url: string): string {
    if (!url) return url;
    
    // Check if it's a MinIO URL
    const config = {
      publicUrl: process.env.MINIO_PUBLIC_URL || 'http://localhost:9000',
      bucketName: process.env.MINIO_BUCKET_NAME || 'products',
    };
    
    if (url.includes(config.publicUrl) || url.includes('/' + config.bucketName + '/')) {
      // Import dynamically to avoid circular dependencies
      const { getProxyUrl } = require('@/lib/storage');
      return getProxyUrl(url);
    }
    
    // For relative paths starting with /, assume they're already proxy URLs or public paths
    if (url.startsWith('/')) {
      return url;
    }
    
    // For external URLs (http/https), return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // For storage keys without URL, convert to proxy URL
    const { getProxyUrl } = require('@/lib/storage');
    return getProxyUrl(url);
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
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
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

    // Get user information for email
    const user = await this.userRepository.findById(data.userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Send order confirmation email (non-blocking)
    this.sendOrderConfirmationEmail(order as Order, user.email, user.name || 'Customer').catch((error) => {
      logger.error('Failed to send order confirmation email', {
        orderId: order.id,
        userId: data.userId,
        email: user.email,
        error: error.message,
      });
    });

    // Transform product image URLs in order items
    return this.transformOrderImages(order as Order);
  }

  /**
   * Send order confirmation email
   */
  private async sendOrderConfirmationEmail(
    order: Order,
    customerEmail: string,
    customerName: string
  ): Promise<void> {
    try {
      const emailService = new EmailService();
      const isConfigured = await emailService.isEmailConfigured();
      
      if (!isConfigured) {
        logger.warn('Order confirmation email not sent - email service not configured', {
          orderId: order.id,
          email: customerEmail,
        });
        return;
      }

      if (!order.address) {
        logger.warn('Order confirmation email not sent - address not found', {
          orderId: order.id,
        });
        return;
      }

      // Format order items
      const items = order.orderItems.map((item) => ({
        productName: item.product?.name || 'Product',
        quantity: item.quantity,
        price: item.price,
      }));

      // Format payment method
      const paymentMethodMap: Record<string, string> = {
        COD: 'Cash on Delivery',
        RAZORPAY: 'Online Payment (Razorpay)',
        STRIPE: 'Online Payment (Stripe)',
        PAYPAL: 'PayPal',
      };
      const paymentMethod = paymentMethodMap[order.paymentMethod] || order.paymentMethod;

      // Format order status
      const statusMap: Record<string, string> = {
        PENDING: 'Pending',
        CONFIRMED: 'Confirmed',
        PROCESSING: 'Processing',
        SHIPPED: 'Shipped',
        DELIVERED: 'Delivered',
        CANCELLED: 'Cancelled',
        REFUNDED: 'Refunded',
      };
      const orderStatus = statusMap[order.status] || order.status;

      const template = EmailTemplatesService.generateOrderConfirmationEmail({
        orderNumber: order.id,
        customerName,
        customerEmail,
        orderDate: new Date(order.createdAt).toLocaleString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        items,
        subtotal: order.subtotal,
        shipping: order.shipping,
        tax: order.tax,
        total: order.total,
        shippingAddress: {
          name: order.address.fullName,
          address: `${order.address.addressLine1}${order.address.addressLine2 ? `, ${order.address.addressLine2}` : ''}`,
          city: order.address.city,
          state: order.address.state,
          postalCode: order.address.postalCode,
          country: order.address.country,
          phone: order.address.phone,
        },
        paymentMethod,
        orderStatus,
      });

      await emailService.sendEmail({
        to: customerEmail,
        subject: `Order Confirmation - ${order.id}`,
        html: template.html,
        text: template.text,
      });
    } catch (error: any) {
      // Log but don't throw - email failure shouldn't break order creation
      logger.error('Error sending order confirmation email', {
        orderId: order.id,
        email: customerEmail,
        error: error.message,
      });
    }
  }

  async updateOrderStatus(
    id: string,
    data: UpdateOrderStatusData
  ): Promise<Order> {
    const order = await this.getOrderById(id);
    const previousStatus = order.status;

    // Validate status transition
    if (data.status && !canTransitionOrder(order.status, data.status)) {
      throw new ValidationError(
        `Cannot transition order from ${order.status} to ${data.status}`
      );
    }

    const updatedOrder = await this.orderRepository.updateStatus(id, data);
    // Re-fetch to get full order with relations
    const fullOrder = await this.orderRepository.findById(updatedOrder.id);
    if (!fullOrder) {
      throw new NotFoundError('Order');
    }

    // Send status update email if status changed
    if (data.status && data.status !== previousStatus && fullOrder.user) {
      this.sendOrderStatusUpdateEmail(
        fullOrder as Order,
        previousStatus,
        data.status,
        fullOrder.user.email,
        fullOrder.user.name || 'Customer'
      ).catch((error) => {
        logger.error('Failed to send order status update email', {
          orderId: fullOrder.id,
          userId: fullOrder.userId,
          email: fullOrder.user?.email,
          previousStatus,
          newStatus: data.status,
          error: error.message,
        });
      });
    }

    // Transform product image URLs
    return this.transformOrderImages(fullOrder);
  }

  /**
   * Send order status update email
   */
  private async sendOrderStatusUpdateEmail(
    order: Order,
    previousStatus: string,
    newStatus: string,
    customerEmail: string,
    customerName: string
  ): Promise<void> {
    try {
      const emailService = new EmailService();
      const isConfigured = await emailService.isEmailConfigured();
      
      if (!isConfigured) {
        logger.warn('Order status update email not sent - email service not configured', {
          orderId: order.id,
          email: customerEmail,
          newStatus,
        });
        return;
      }

      // Get tracking information if available (from shipment/logistics)
      let trackingUrl: string | undefined;
      let trackingNumber: string | undefined;

      // Try to get tracking info from shipment if order is shipped
      if (newStatus === OrderStatus.SHIPPED || newStatus === OrderStatus.DELIVERED) {
        try {
          // Check if there's a shipment with tracking info
          const shipment = await prisma.shipment.findFirst({
            where: { orderId: order.id },
            orderBy: { createdAt: 'desc' },
          });
          
          if (shipment?.awbNumber) {
            trackingNumber = shipment.awbNumber;
            // Generate tracking URL if available
            if (shipment.trackingUrl) {
              trackingUrl = shipment.trackingUrl;
            } else if (process.env.NEXT_PUBLIC_APP_URL) {
              trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/tracking?awb=${shipment.awbNumber}`;
            }
          }
        } catch (error) {
          // Log but don't fail - tracking info is optional
          logger.debug('Could not fetch tracking information for order status email', {
            orderId: order.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Format order items
      const items = order.orderItems.map((item) => ({
        productName: item.product?.name || 'Product',
        quantity: item.quantity,
        price: item.price,
      }));

      const template = EmailTemplatesService.generateOrderStatusUpdateEmail({
        orderNumber: order.id,
        customerName,
        customerEmail,
        previousStatus,
        newStatus,
        orderDate: new Date(order.createdAt).toLocaleString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        items,
        total: order.total,
        trackingUrl,
        trackingNumber,
      });

      // Status-specific subject lines
      const statusSubjects: Record<string, string> = {
        CONFIRMED: `Order Confirmed - ${order.id}`,
        PROCESSING: `Your Order is Being Processed - ${order.id}`,
        SHIPPED: `Your Order Has Shipped! - ${order.id}`,
        DELIVERED: `Your Order Has Been Delivered - ${order.id}`,
        CANCELLED: `Order Cancellation - ${order.id}`,
        RETURNED: `Order Return Processed - ${order.id}`,
      };
      const subject = statusSubjects[newStatus] || `Order Status Update - ${order.id}`;

      await emailService.sendEmail({
        to: customerEmail,
        subject,
        html: template.html,
        text: template.text,
      });
    } catch (error: any) {
      // Log but don't throw - email failure shouldn't break status update
      logger.error('Error sending order status update email', {
        orderId: order.id,
        email: customerEmail,
        previousStatus,
        newStatus,
        error: error.message,
      });
    }
  }
}

