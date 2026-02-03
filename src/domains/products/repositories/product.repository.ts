/**
 * Product repository - Data access layer for products
 */

import { prisma } from '@/src/infrastructure/database/prisma';
import { Product, ProductFilters, ProductSort, PaginationParams } from '../types/product.types';

export class ProductRepository {
  async findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        variants: true,
        attributes: true,
        tags: true,
        categoryRef: true,
      } as any,
    }) as unknown as Product | null;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        brand: true,
        variants: true,
        attributes: true,
        tags: true,
        categoryRef: true,
      } as any,
    }) as unknown as Product | null;
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
        include: {
          brand: true,
          variants: true,
          attributes: true,
          tags: true,
          categoryRef: true,
        } as any,
      }),
      prisma.product.count({ where }),
    ]);

    return { products: products as unknown as Product[], total };
  }

  async create(data: {
    name: string;
    slug: string;
    sku?: string;
    description?: string;
    price: number;
    originalPrice?: number;
    image: string;
    images?: string[];
    category?: string;
    categoryId?: string;
    status?: string;
    inStock?: boolean;
    stockQuantity?: number;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    ogImage?: string;
    weight?: number;
    dimensions?: any;
    taxClass?: string;
    supplierName?: string;
    supplierLocation?: string;
    supplierCertification?: string;
    returnPolicy?: string;
    returnDays?: number;
    brandId?: string;
    tagIds?: string[];
    attributes?: Array<{ key: string; value: string }>;
  }): Promise<Product> {
    const { tagIds, attributes, categoryId, category, ...productData } = data;
    
    return prisma.product.create({
      data: {
        ...productData,
        category: category || '', // Ensure category is always a string
        categoryId: categoryId || null, // Explicitly set to null if undefined
        status: (productData.status as any) || 'DRAFT',
        inStock: productData.inStock ?? true,
        stockQuantity: productData.stockQuantity ?? 0,
        tags: tagIds ? {
          connect: tagIds.map(id => ({ id })),
        } : undefined,
        attributes: attributes ? {
          create: attributes,
        } : undefined,
      } as any,
      include: {
        brand: true,
        variants: true,
        attributes: true,
        tags: true,
        categoryRef: true,
      } as any,
    }) as unknown as Product;
  }

  async update(id: string, data: Partial<Product> & {
    tagIds?: string[];
    attributes?: Array<{ key: string; value: string }>;
  }): Promise<Product> {
    const { tagIds, attributes, categoryId, ...productData } = data;
    
    // Handle tag updates
    if (tagIds !== undefined) {
      // Use set to replace all tags at once
      await prisma.product.update({
        where: { id },
        data: {
          tags: {
            set: tagIds.map(tagId => ({ id: tagId })),
          },
        } as any,
      });
    }
    
    // Handle attribute updates
    if (attributes !== undefined) {
      // Delete existing attributes
      await (prisma as any).productAttribute.deleteMany({
        where: { productId: id },
      });
      
      // Create new attributes
      if (attributes.length > 0) {
        await (prisma as any).productAttribute.createMany({
          data: attributes.map(attr => ({
            productId: id,
            key: attr.key,
            value: attr.value,
          })),
        });
      }
    }
    
    // Prepare update data with categoryId handling
    const updateData: any = { ...productData };
    if (categoryId !== undefined) {
      updateData.categoryId = categoryId || null;
    }
    
    return prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        brand: true,
        variants: true,
        attributes: true,
        tags: true,
        categoryRef: true,
      } as any,
    }) as unknown as Product;
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
      include: {
        brand: true,
        variants: true,
        attributes: true,
        tags: true,
        categoryRef: true,
      } as any,
    }) as unknown as Product;
  }
}

