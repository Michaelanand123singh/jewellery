/**
 * Product repository - Data access layer for products
 */

import { prisma } from '@/src/infrastructure/database/prisma';
import { Product, ProductFilters, ProductSort, PaginationParams } from '../types/product.types';

export class ProductRepository {
  async findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { id },
    });
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { slug },
    });
  }

  async findMany(
    filters?: ProductFilters,
    sort?: ProductSort,
    pagination?: PaginationParams
  ): Promise<{ products: Product[]; total: number }> {
    const where: any = {};

    if (filters?.category) {
      // Use startsWith to match categories like "women-rings" when filtering by "women"
      // This allows subcategories to be stored as "category-subcategory" format
      where.category = {
        startsWith: filters.category,
        mode: 'insensitive',
      };
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.minPrice || filters?.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = filters.minPrice;
      if (filters.maxPrice) where.price.lte = filters.maxPrice;
    }

    if (filters?.inStock !== undefined) {
      where.inStock = filters.inStock;
    }

    if (filters?.rating) {
      where.rating = { gte: filters.rating };
    }

    const orderBy: any = {};
    if (sort?.sortBy) {
      orderBy[sort.sortBy] = sort.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const skip = pagination?.skip ?? 0;
    const take = pagination?.limit ?? 20;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total };
  }

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    price: number;
    originalPrice?: number;
    image: string;
    images?: string[];
    category: string;
    inStock: boolean;
    stockQuantity: number;
  }): Promise<Product> {
    return prisma.product.create({
      data,
    });
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.product.delete({
      where: { id },
    });
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    return prisma.product.update({
      where: { id },
      data: {
        stockQuantity: quantity,
        inStock: quantity > 0,
      },
    });
  }
}

