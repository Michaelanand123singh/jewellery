/**
 * Cart repository - Data access layer for cart
 */

import { prisma } from '@/src/infrastructure/database/prisma';
import { CartItem } from '../types/cart.types';

export class CartRepository {
  async findByUserId(userId: string): Promise<CartItem[]> {
    return prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            originalPrice: true,
            image: true,
            inStock: true,
            stockQuantity: true,
          },
        },
      },
    }) as Promise<CartItem[]>;
  }

  async findByUserAndProduct(userId: string, productId: string, variantId?: string | null): Promise<CartItem | null> {
    // Use findFirst because the unique constraint includes variantId
    // If variantId is provided, match it; otherwise match items without variants
    return prisma.cartItem.findFirst({
      where: {
        userId,
        productId,
        variantId: variantId !== undefined ? variantId : null,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            originalPrice: true,
            image: true,
            inStock: true,
            stockQuantity: true,
          },
        },
      },
    }) as Promise<CartItem | null>;
  }

  async create(data: { userId: string; productId: string; quantity: number }): Promise<CartItem> {
    return prisma.cartItem.create({
      data,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            originalPrice: true,
            image: true,
            inStock: true,
            stockQuantity: true,
          },
        },
      },
    }) as Promise<CartItem>;
  }

  async update(
    id: string,
    data: { quantity: number }
  ): Promise<CartItem> {
    return prisma.cartItem.update({
      where: { id },
      data,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            originalPrice: true,
            image: true,
            inStock: true,
            stockQuantity: true,
          },
        },
      },
    }) as Promise<CartItem>;
  }

  async findById(id: string): Promise<CartItem | null> {
    return prisma.cartItem.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            originalPrice: true,
            image: true,
            inStock: true,
            stockQuantity: true,
          },
        },
      },
    }) as Promise<CartItem | null>;
  }

  async delete(id: string): Promise<void> {
    await prisma.cartItem.delete({
      where: { id },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await prisma.cartItem.deleteMany({
      where: { userId },
    });
  }
}

