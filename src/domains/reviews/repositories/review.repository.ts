/**
 * Review repository - Data access layer for reviews
 */

import { prisma } from '@/src/infrastructure/database/prisma';
import { Review } from '../types/review.types';
import { PaginationParams } from '@/src/shared/types/common.types';

export class ReviewRepository {
  async findById(id: string): Promise<Review | null> {
    return prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }) as Promise<Review | null>;
  }

  async findByProductId(
    productId: string,
    pagination?: PaginationParams
  ): Promise<{ reviews: Review[]; total: number }> {
    const skip = pagination?.skip ?? 0;
    const take = pagination?.limit ?? 20;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.review.count({ where: { productId } }),
    ]);

    return { reviews: reviews as Review[], total };
  }

  async findByUserAndProduct(userId: string, productId: string): Promise<Review | null> {
    return prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }) as Promise<Review | null>;
  }

  async create(data: {
    userId: string;
    productId: string;
    rating: number;
    comment?: string;
    verified?: boolean;
  }): Promise<Review> {
    return prisma.review.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }) as Promise<Review>;
  }

  async update(
    id: string,
    data: { rating?: number; comment?: string }
  ): Promise<Review> {
    return prisma.review.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }) as Promise<Review>;
  }

  async delete(id: string): Promise<void> {
    await prisma.review.delete({
      where: { id },
    });
  }

  async calculateProductRating(productId: string): Promise<{ rating: number; count: number }> {
    const reviews = await prisma.review.findMany({
      // Only include verified reviews when calculating rating, so that
      // pending/unapproved reviews (when enabled) don't affect the score.
      where: { productId, verified: true },
      select: { rating: true },
    });

    if (reviews.length === 0) {
      return { rating: 0, count: 0 };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    return {
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      count: reviews.length,
    };
  }
}

