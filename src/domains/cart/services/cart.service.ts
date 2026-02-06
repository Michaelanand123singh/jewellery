/**
 * Cart service - Business logic for cart
 */

import { CartRepository } from '../repositories/cart.repository';
import { ProductRepository } from '@/src/domains/products/repositories/product.repository';
import { ProductVariantRepository } from '@/src/domains/products/repositories/variant.repository';
import { CartItem, AddToCartData, UpdateCartItemData } from '../types/cart.types';
import { NotFoundError, ValidationError } from '@/src/shared/utils/errors';

export class CartService {
  private cartRepository: CartRepository;
  private productRepository: ProductRepository;
  private variantRepository: ProductVariantRepository;

  constructor() {
    this.cartRepository = new CartRepository();
    this.productRepository = new ProductRepository();
    this.variantRepository = new ProductVariantRepository();
  }

  async getCart(userId: string): Promise<CartItem[]> {
    const cartItems = await this.cartRepository.findByUserId(userId);
    // Transform product and variant image URLs
    return cartItems.map(item => this.transformCartItemImages(item));
  }

  async addToCart(data: AddToCartData): Promise<CartItem> {
    // Verify product exists
    const product = await this.productRepository.findById(data.productId);
    if (!product) {
      throw new NotFoundError('Product');
    }

    // If variant is specified, check variant stock
    if (data.variantId) {
      const variant = await this.variantRepository.findById(data.variantId);
      if (!variant) {
        throw new NotFoundError('Product variant');
      }

      if (variant.productId !== data.productId) {
        throw new ValidationError('Variant does not belong to this product');
      }

      if (variant.stockQuantity < data.quantity) {
        throw new ValidationError(
          `Only ${variant.stockQuantity} items available for ${variant.name}`
        );
      }

      // Check if item already in cart (with same variant)
      const existingItem = await this.cartRepository.findByUserAndProduct(
        data.userId,
        data.productId,
        data.variantId
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + data.quantity;
        
        if (variant.stockQuantity < newQuantity) {
          throw new ValidationError(
            `Only ${variant.stockQuantity} items available. You already have ${existingItem.quantity} in cart.`
          );
        }

        const updatedItem = await this.cartRepository.update(existingItem.id, { quantity: newQuantity });
        return this.transformCartItemImages(updatedItem);
      }

      // Create new cart item with variant
      const newItem = await this.cartRepository.create({
        userId: data.userId,
        productId: data.productId,
        variantId: data.variantId,
        quantity: data.quantity,
      });
      return this.transformCartItemImages(newItem);
    }

    // No variant - check product stock
    if (!product.inStock) {
      throw new ValidationError('Product is out of stock');
    }

    if (product.stockQuantity < data.quantity) {
      throw new ValidationError(
        `Only ${product.stockQuantity} items available`
      );
    }

    // Check if item already in cart (without variant)
    const existingItem = await this.cartRepository.findByUserAndProduct(
      data.userId,
      data.productId,
      null
    );

      if (existingItem) {
        const newQuantity = existingItem.quantity + data.quantity;
        
        if (product.stockQuantity < newQuantity) {
          throw new ValidationError(
            `Only ${product.stockQuantity} items available. You already have ${existingItem.quantity} in cart.`
          );
        }

        const updatedItem = await this.cartRepository.update(existingItem.id, { quantity: newQuantity });
        return this.transformCartItemImages(updatedItem);
      }

      // Create new cart item without variant
      const newItem = await this.cartRepository.create({
        userId: data.userId,
        productId: data.productId,
        variantId: null,
        quantity: data.quantity,
      });
      return this.transformCartItemImages(newItem);
  }

  async updateCartItem(
    userId: string,
    itemId: string,
    data: UpdateCartItemData
  ): Promise<CartItem> {
    const item = await this.cartRepository.findById(itemId);
    if (!item || item.userId !== userId) {
      throw new NotFoundError('Cart item');
    }

    if (data.quantity <= 0) {
      await this.cartRepository.delete(itemId);
      throw new ValidationError('Quantity must be greater than 0');
    }

    // Check stock availability - prioritize variant stock if variant exists
    if (item.variantId && item.variant) {
      if (item.variant.stockQuantity < data.quantity) {
        throw new ValidationError(
          `Only ${item.variant.stockQuantity} items available for ${item.variant.name}`
        );
      }
    } else {
      const product = item.product;
      if (product.stockQuantity < data.quantity) {
        throw new ValidationError(
          `Only ${product.stockQuantity} items available`
        );
      }
    }

    const updatedItem = await this.cartRepository.update(itemId, data);
    return this.transformCartItemImages(updatedItem);
  }

  /**
   * Transform product and variant image URLs in cart items
   */
  private transformCartItemImages(item: CartItem): CartItem {
    return {
      ...item,
      product: {
        ...item.product,
        image: item.product.image ? this.transformImageUrl(item.product.image) : item.product.image,
      },
      variant: item.variant ? {
        ...item.variant,
        image: item.variant.image ? this.transformImageUrl(item.variant.image) : item.variant.image,
      } : item.variant,
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

  async removeFromCart(userId: string, itemId: string): Promise<void> {
    const item = await this.cartRepository.findById(itemId);
    if (!item || item.userId !== userId) {
      throw new NotFoundError('Cart item');
    }

    await this.cartRepository.delete(itemId);
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartRepository.deleteByUserId(userId);
  }
}

