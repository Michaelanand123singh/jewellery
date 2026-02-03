/**
 * Product Variant repository - Data access layer for product variants
 */

import { prisma } from '@/src/infrastructure/database/prisma';
import { ProductVariant, CreateProductVariantData, UpdateProductVariantData } from '../types/product.types';

export class ProductVariantRepository {
  async findById(id: string): Promise<ProductVariant | null> {
    return prisma.productVariant.findUnique({
      where: { id },
    }) as unknown as ProductVariant | null;
  }

  async findBySku(sku: string): Promise<ProductVariant | null> {
    return prisma.productVariant.findUnique({
      where: { sku },
    }) as unknown as ProductVariant | null;
  }

  async findByProductId(productId: string): Promise<ProductVariant[]> {
    return prisma.productVariant.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' },
    }) as unknown as ProductVariant[];
  }

  async create(data: CreateProductVariantData): Promise<ProductVariant> {
    return prisma.productVariant.create({
      data: {
        ...data,
        stockQuantity: data.stockQuantity ?? 0,
      },
    }) as unknown as ProductVariant;
  }

  async update(id: string, data: UpdateProductVariantData): Promise<ProductVariant> {
    return prisma.productVariant.update({
      where: { id },
      data,
    }) as unknown as ProductVariant;
  }

  async delete(id: string): Promise<void> {
    await prisma.productVariant.delete({
      where: { id },
    });
  }

  async updateStock(id: string, quantity: number): Promise<ProductVariant> {
    return prisma.productVariant.update({
      where: { id },
      data: {
        stockQuantity: quantity,
      },
    }) as unknown as ProductVariant;
  }
}

