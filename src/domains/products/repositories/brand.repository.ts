/**
 * Brand repository - Data access layer for brands
 */

import { prisma } from '@/src/infrastructure/database/prisma';
import { Brand, CreateBrandData, UpdateBrandData } from '../types/product.types';

export class BrandRepository {
  async findById(id: string): Promise<Brand | null> {
    return prisma.brand.findUnique({
      where: { id },
    }) as unknown as Brand | null;
  }

  async findBySlug(slug: string): Promise<Brand | null> {
    return prisma.brand.findUnique({
      where: { slug },
    }) as unknown as Brand | null;
  }

  async findMany(): Promise<Brand[]> {
    return prisma.brand.findMany({
      orderBy: { name: 'asc' },
    }) as unknown as Brand[];
  }

  async create(data: CreateBrandData): Promise<Brand> {
    return prisma.brand.create({
      data,
    }) as unknown as Brand;
  }

  async update(id: string, data: UpdateBrandData): Promise<Brand> {
    return prisma.brand.update({
      where: { id },
      data,
    }) as unknown as Brand;
  }

  async delete(id: string): Promise<void> {
    await prisma.brand.delete({
      where: { id },
    });
  }
}

