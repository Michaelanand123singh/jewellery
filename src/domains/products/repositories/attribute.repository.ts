/**
 * Product Attribute repository - Data access layer for product attributes
 */

import { prisma } from '@/src/infrastructure/database/prisma';
import { ProductAttribute } from '../types/product.types';

export class ProductAttributeRepository {
  async findByProductId(productId: string): Promise<ProductAttribute[]> {
    return prisma.productAttribute.findMany({
      where: { productId },
      orderBy: { key: 'asc' },
    }) as unknown as ProductAttribute[];
  }

  async create(productId: string, key: string, value: string): Promise<ProductAttribute> {
    return prisma.productAttribute.create({
      data: {
        productId,
        key,
        value,
      },
    }) as unknown as ProductAttribute;
  }

  async delete(id: string): Promise<void> {
    await prisma.productAttribute.delete({
      where: { id },
    });
  }

  async deleteByProductId(productId: string): Promise<void> {
    await prisma.productAttribute.deleteMany({
      where: { productId },
    });
  }
}

