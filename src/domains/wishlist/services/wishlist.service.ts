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
    const wishlistItems = await this.wishlistRepository.findByUserId(userId);
    // Transform product image URLs
    return wishlistItems.map(item => this.transformWishlistItemImages(item));
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

    const item = await this.wishlistRepository.create({ userId, productId });
    return this.transformWishlistItemImages(item);
  }

  /**
   * Transform product image URLs in wishlist items
   */
  private transformWishlistItemImages(item: WishlistItem): WishlistItem {
    return {
      ...item,
      product: {
        ...item.product,
        image: item.product.image ? this.transformImageUrl(item.product.image) : item.product.image,
      },
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

