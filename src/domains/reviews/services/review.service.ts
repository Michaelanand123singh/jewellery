/**
 * Review service - Business logic for reviews
 */

import { ReviewRepository } from '../repositories/review.repository';
import { ProductRepository } from '@/src/domains/products/repositories/product.repository';
import {
  Review,
  CreateReviewData,
  UpdateReviewData,
} from '../types/review.types';
import { PaginationParams } from '@/src/shared/types/common.types';
import { NotFoundError, ValidationError } from '@/src/shared/utils/errors';
import { prisma } from '@/src/infrastructure/database/prisma';

export class ReviewService {
  private reviewRepository: ReviewRepository;
  private productRepository: ProductRepository;

  constructor() {
    this.reviewRepository = new ReviewRepository();
    this.productRepository = new ProductRepository();
  }

  async getReviewById(id: string): Promise<Review> {
    const review = await this.reviewRepository.findById(id);
    if (!review) {
      throw new NotFoundError('Review');
    }
    return review;
  }

  async getReviewsByProductId(
    productId: string,
    pagination?: PaginationParams
  ): Promise<{ reviews: Review[]; total: number; totalPages: number }> {
    // Verify product exists
    await this.productRepository.findById(productId);

    const { reviews, total } = await this.reviewRepository.findByProductId(
      productId,
      pagination
    );

    const limit = pagination?.limit ?? 20;
    const totalPages = Math.ceil(total / limit);

    return { reviews, total, totalPages };
  }

  async createReview(data: CreateReviewData): Promise<Review> {
    // Verify product exists
    await this.productRepository.findById(data.productId);

    // Check if user already reviewed this product
    const existing = await this.reviewRepository.findByUserAndProduct(
      data.userId,
      data.productId
    );

    if (existing) {
      throw new ValidationError('You have already reviewed this product');
    }

    // Create review
    const review = await this.reviewRepository.create({
      userId: data.userId,
      productId: data.productId,
      rating: data.rating,
      comment: data.comment,
    });

    // Update product rating
    await this.updateProductRating(data.productId);

    return review;
  }

  async updateReview(
    reviewId: string,
    userId: string,
    data: UpdateReviewData
  ): Promise<Review> {
    const review = await this.getReviewById(reviewId);

    // Ensure user owns the review
    if (review.userId !== userId) {
      throw new ValidationError('You can only update your own reviews');
    }

    const updated = await this.reviewRepository.update(reviewId, data);

    // Update product rating
    await this.updateProductRating(review.productId);

    return updated;
  }

  async deleteReview(reviewId: string, userId: string): Promise<void> {
    const review = await this.getReviewById(reviewId);

    // Ensure user owns the review
    if (review.userId !== userId) {
      throw new ValidationError('You can only delete your own reviews');
    }

    const productId = review.productId;
    await this.reviewRepository.delete(reviewId);

    // Update product rating
    await this.updateProductRating(productId);
  }

  private async updateProductRating(productId: string): Promise<void> {
    const { rating, count } = await this.reviewRepository.calculateProductRating(productId);

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating,
        reviewCount: count,
      },
    });
  }
}

