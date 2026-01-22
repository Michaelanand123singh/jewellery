/**
 * Wishlist repository - Data access layer for wishlist
 */

import { prisma } from '@/src/infrastructure/database/prisma';
import { WishlistItem } from '../types/wishlist.types';

export class WishlistRepository {
  async findByUserId(userId: string): Promise<WishlistItem[]> {
    return prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            originalPrice: true,
            image: true,
            description: true,
            category: true,
            inStock: true,
            rating: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<WishlistItem[]>;
  }

  async findByUserAndProduct(userId: string, productId: string): Promise<WishlistItem | null> {
    return prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            originalPrice: true,
            image: true,
            description: true,
            category: true,
            inStock: true,
            rating: true,
          },
        },
      },
    }) as Promise<WishlistItem | null>;
  }

  async create(data: { userId: string; productId: string }): Promise<WishlistItem> {
    return prisma.wishlistItem.create({
      data,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            originalPrice: true,
            image: true,
            description: true,
            category: true,
            inStock: true,
            rating: true,
          },
        },
      },
    }) as Promise<WishlistItem>;
  }

  async delete(userId: string, productId: string): Promise<void> {
    await prisma.wishlistItem.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
  }

  async checkExists(userId: string, productId: string): Promise<boolean> {
    const item = await this.findByUserAndProduct(userId, productId);
    return item !== null;
  }
}

