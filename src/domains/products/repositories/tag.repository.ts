/**
 * Product Tag repository - Data access layer for product tags
 */

import { prisma } from '@/src/infrastructure/database/prisma';
import { ProductTag, CreateProductTagData, UpdateProductTagData } from '../types/product.types';

export class ProductTagRepository {
  async findById(id: string): Promise<ProductTag | null> {
    return prisma.productTag.findUnique({
      where: { id },
    }) as unknown as ProductTag | null;
  }

  async findBySlug(slug: string): Promise<ProductTag | null> {
    return prisma.productTag.findUnique({
      where: { slug },
    }) as unknown as ProductTag | null;
  }

  async findMany(): Promise<ProductTag[]> {
    return prisma.productTag.findMany({
      orderBy: { name: 'asc' },
    }) as unknown as ProductTag[];
  }

  async create(data: CreateProductTagData): Promise<ProductTag> {
    return prisma.productTag.create({
      data,
    }) as unknown as ProductTag;
  }

  async update(id: string, data: UpdateProductTagData): Promise<ProductTag> {
    return prisma.productTag.update({
      where: { id },
      data,
    }) as unknown as ProductTag;
  }

  async delete(id: string): Promise<void> {
    await prisma.productTag.delete({
      where: { id },
    });
  }
}

