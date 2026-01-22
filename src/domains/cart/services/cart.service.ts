/**
 * Cart service - Business logic for cart
 */

import { CartRepository } from '../repositories/cart.repository';
import { ProductRepository } from '@/src/domains/products/repositories/product.repository';
import { CartItem, AddToCartData, UpdateCartItemData } from '../types/cart.types';
import { NotFoundError, ValidationError } from '@/src/shared/utils/errors';

export class CartService {
  private cartRepository: CartRepository;
  private productRepository: ProductRepository;

  constructor() {
    this.cartRepository = new CartRepository();
    this.productRepository = new ProductRepository();
  }

  async getCart(userId: string): Promise<CartItem[]> {
    return this.cartRepository.findByUserId(userId);
  }

  async addToCart(data: AddToCartData): Promise<CartItem> {
    // Verify product exists and is in stock
    const product = await this.productRepository.findById(data.productId);
    if (!product) {
      throw new NotFoundError('Product');
    }

    if (!product.inStock) {
      throw new ValidationError('Product is out of stock');
    }

    if (product.stockQuantity < data.quantity) {
      throw new ValidationError(
        `Only ${product.stockQuantity} items available`
      );
    }

    // Check if item already in cart
    const existingItem = await this.cartRepository.findByUserAndProduct(
      data.userId,
      data.productId
    );

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + data.quantity;
      
      if (product.stockQuantity < newQuantity) {
        throw new ValidationError(
          `Only ${product.stockQuantity} items available. You already have ${existingItem.quantity} in cart.`
        );
      }

      return this.cartRepository.update(existingItem.id, { quantity: newQuantity });
    }

    // Create new cart item
    return this.cartRepository.create({
      userId: data.userId,
      productId: data.productId,
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

    // Check stock availability
    const product = item.product;
    if (product.stockQuantity < data.quantity) {
      throw new ValidationError(
        `Only ${product.stockQuantity} items available`
      );
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

