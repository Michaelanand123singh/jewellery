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
    return this.cartRepository.findByUserId(userId);
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

        return this.cartRepository.update(existingItem.id, { quantity: newQuantity });
      }

      // Create new cart item with variant
      return this.cartRepository.create({
        userId: data.userId,
        productId: data.productId,
        variantId: data.variantId,
        quantity: data.quantity,
      });
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

      return this.cartRepository.update(existingItem.id, { quantity: newQuantity });
    }

    // Create new cart item without variant
    return this.cartRepository.create({
      userId: data.userId,
      productId: data.productId,
      variantId: null,
      quantity: data.quantity,
    });
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

    return this.cartRepository.update(itemId, data);
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

