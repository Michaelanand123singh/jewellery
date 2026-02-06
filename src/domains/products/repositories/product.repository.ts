/**
 * Product repository - Data access layer for products
 */

import { prisma } from '@/src/infrastructure/database/prisma';
import { Product, ProductFilters, ProductSort, PaginationParams, ProductDimensions } from '../types/product.types';
import { AppError } from '@/src/shared/utils/errors';

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
    pagination?: PaginationParams,
    includeDraft: boolean = false
  ): Promise<{ products: Product[]; total: number }> {
    const where: any = {};

    // Filter by status
    if (filters?.status) {
      // If status filter is explicitly provided, use it
      where.status = filters.status;
    } else if (!includeDraft) {
      // If no status filter and not admin, only show PUBLISHED products
      where.status = 'PUBLISHED';
    }
    // If includeDraft is true and no status filter, show all statuses (admin view)

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
    originalPrice?: number | null;
    image: string;
    images?: string[];
    category?: string;
    categoryId?: string | null;
    status?: string;
    inStock?: boolean;
    stockQuantity?: number;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    ogImage?: string;
    weight?: number | null;
    dimensions?: ProductDimensions | null;
    taxClass?: string;
    supplierName?: string;
    supplierLocation?: string;
    supplierCertification?: string;
    returnPolicy?: string;
    returnDays?: number | null;
    brandId?: string | null;
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
    originalPrice?: number | null;
    weight?: number | null;
    returnDays?: number | null;
    categoryId?: string | null;
    brandId?: string | null;
    dimensions?: ProductDimensions | null;
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
    
    // Prepare update data - preserve null values explicitly
    const updateData: any = { ...productData };
    
    // Handle nullable fields - explicitly set null if provided
    if (categoryId !== undefined) {
      updateData.categoryId = categoryId;
    }
    if ('originalPrice' in data) {
      updateData.originalPrice = data.originalPrice;
    }
    if ('weight' in data) {
      updateData.weight = data.weight;
    }
    if ('returnDays' in data) {
      updateData.returnDays = data.returnDays;
    }
    if ('brandId' in data) {
      updateData.brandId = data.brandId;
    }
    if ('dimensions' in data) {
      updateData.dimensions = data.dimensions;
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
    // Check if product has any order items (foreign key constraint)
    const orderItemCount = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItemCount > 0) {
      throw new AppError(
        `Cannot delete product: It has been ordered ${orderItemCount} time(s). Products with order history cannot be deleted to maintain data integrity. Consider archiving the product instead by changing its status to ARCHIVED.`,
        409,
        'PRODUCT_HAS_ORDERS'
      );
    }

    // Clean up related data that can be safely deleted
    await Promise.all([
      prisma.cartItem.deleteMany({ where: { productId: id } }),
      prisma.wishlistItem.deleteMany({ where: { productId: id } }),
      prisma.productVariant.deleteMany({ where: { productId: id } }),
      prisma.productAttribute.deleteMany({ where: { productId: id } }),
      prisma.$executeRaw`DELETE FROM "_ProductToProductTag" WHERE "A" = ${id}`,
    ]);

    // Delete the product
    await prisma.product.delete({ where: { id } });
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

