/**
 * Wishlist service - Business logic for wishlist
 */

import { WishlistRepository } from '../repositories/wishlist.repository';
import { ProductRepository } from '@/src/domains/products/repositories/product.repository';
import { WishlistItem } from '../types/wishlist.types';
import { NotFoundError, ValidationError } from '@/src/shared/utils/errors';

export class WishlistService {
  private wishlistRepository: WishlistRepository;
  private productRepository: ProductRepository;

  constructor() {
    this.wishlistRepository = new WishlistRepository();
    this.productRepository = new ProductRepository();
  }

  async getWishlist(userId: string): Promise<WishlistItem[]> {
    return this.wishlistRepository.findByUserId(userId);
  }

  async addToWishlist(userId: string, productId: string): Promise<WishlistItem> {
    // Verify product exists
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product');
    }

    // Check if already in wishlist
    const exists = await this.wishlistRepository.checkExists(userId, productId);
    if (exists) {
      throw new ValidationError('Product already in wishlist');
    }

    return this.wishlistRepository.create({ userId, productId });
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    const item = await this.wishlistRepository.findByUserAndProduct(userId, productId);
    if (!item) {
      throw new NotFoundError('Wishlist item');
    }

    await this.wishlistRepository.delete(userId, productId);
  }

  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    return this.wishlistRepository.checkExists(userId, productId);
  }
}

