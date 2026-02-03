/**
 * Inventory repository - Data access layer for inventory and stock movements
 */

import { prisma } from '@/src/infrastructure/database/prisma';
import { $Enums } from '@prisma/client';
import {
  StockMovement,
  CreateStockMovementData,
  InventoryFilters,
  InventorySort,
  PaginationParams,
  InventoryStats,
  ProductInventory,
} from '../types/inventory.types';

export class InventoryRepository {
  async createStockMovement(data: CreateStockMovementData): Promise<StockMovement> {
    let previousStock: number;
    let newStock: number;
    let quantity = data.quantity;

    // If variantId provided, work with variant stock
    if (data.variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: data.variantId },
      });

      if (!variant) {
        throw new Error('Product variant not found');
      }

      if (variant.productId !== data.productId) {
        throw new Error('Variant does not belong to this product');
      }

      previousStock = variant.stockQuantity;
    } else {
      // Work with product stock
      const product = await prisma.product.findUnique({
        where: { id: data.productId },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      previousStock = product.stockQuantity;
    }
    
    // Calculate new stock based on movement type
    if (data.type === 'IN' || data.type === 'RETURN') {
      newStock = previousStock + quantity;
    } else if (data.type === 'OUT' || data.type === 'ADJUSTMENT') {
      // For OUT and ADJUSTMENT, quantity should be positive but will be stored as negative
      newStock = previousStock - quantity;
      quantity = -quantity; // Store as negative for OUT movements
    } else {
      newStock = previousStock;
    }

    // Ensure stock doesn't go negative (unless it's an adjustment)
    if (newStock < 0 && data.type !== 'ADJUSTMENT') {
      throw new Error('Insufficient stock');
    }

    // Create stock movement and update stock in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create stock movement
      const movement = await tx.stockMovement.create({
        data: {
          productId: data.productId,
          variantId: data.variantId || null,
          type: data.type,
          quantity,
          previousStock,
          newStock,
          reason: data.reason,
          referenceId: data.referenceId,
          referenceType: data.referenceType,
          createdBy: data.createdBy,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              image: true,
              category: true,
            },
          },
          variant: data.variantId ? {
            select: {
              id: true,
              sku: true,
              name: true,
              stockQuantity: true,
            },
          } : undefined,
        },
      });

      // Update variant stock if variantId provided
      if (data.variantId) {
        await tx.productVariant.update({
          where: { id: data.variantId },
          data: {
            stockQuantity: newStock,
          },
        });

        // Sync product stock from sum of all variants
        const allVariants = await tx.productVariant.findMany({
          where: { productId: data.productId },
        });
        const totalVariantStock = allVariants.reduce(
          (sum, v) => sum + v.stockQuantity,
          0
        );

        await tx.product.update({
          where: { id: data.productId },
          data: {
            stockQuantity: totalVariantStock,
            inStock: totalVariantStock > 0,
          },
        });
      } else {
        // Update product stock directly
        await tx.product.update({
          where: { id: data.productId },
          data: {
            stockQuantity: newStock,
            inStock: newStock > 0,
          },
        });
      }

      return movement;
    });

    return result as unknown as StockMovement;
  }

  async findStockMovements(
    filters?: InventoryFilters,
    sort?: InventorySort,
    pagination?: PaginationParams
  ): Promise<{ movements: StockMovement[]; total: number }> {
    const where: any = {};

    if (filters?.productId) {
      where.productId = filters.productId;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    if (filters?.search) {
      where.OR = [
        { product: { name: { contains: filters.search, mode: 'insensitive' } } },
        { reason: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (sort?.sortBy === 'productName') {
      orderBy.product = { name: sort.sortOrder || 'asc' };
    } else {
      orderBy[sort?.sortBy || 'createdAt'] = sort?.sortOrder || 'desc';
    }

    const skip = pagination?.skip ?? 0;
    const take = pagination?.limit ?? 50;

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              image: true,
              category: true,
            },
          },
        },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return { movements, total };
  }

  async getInventoryStats(lowStockThreshold: number = 10): Promise<InventoryStats> {
    const [
      totalProducts,
      products,
      lowStockCount,
      outOfStockCount,
      recentMovementsCount,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.findMany({
        select: {
          id: true,
          category: true,
          price: true,
          stockQuantity: true,
        },
      }),
      prisma.product.count({
        where: {
          stockQuantity: {
            lte: lowStockThreshold,
            gt: 0,
          },
          inStock: true,
        },
      }),
      prisma.product.count({
        where: {
          OR: [
            { stockQuantity: 0 },
            { inStock: false },
          ],
        },
      }),
      prisma.stockMovement.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    // Calculate total stock value
    const totalStockValue = products.reduce(
      (sum, product) => sum + product.price * product.stockQuantity,
      0
    );

    // Calculate stock value by category
    const categoryMap = new Map<string, { value: number; count: number }>();
    products.forEach((product) => {
      const category = product.category.split('-')[0]; // Get main category
      const existing = categoryMap.get(category) || { value: 0, count: 0 };
      categoryMap.set(category, {
        value: existing.value + product.price * product.stockQuantity,
        count: existing.count + 1,
      });
    });

    const stockValueByCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      ...data,
    }));

    return {
      totalProducts,
      totalStockValue,
      lowStockProducts: lowStockCount,
      outOfStockProducts: outOfStockCount,
      recentMovements: recentMovementsCount,
      stockValueByCategory,
    };
  }

  async getProductInventory(
    filters?: { category?: string; lowStock?: boolean; outOfStock?: boolean; search?: string },
    pagination?: PaginationParams,
    lowStockThreshold: number = 10
  ): Promise<{ products: ProductInventory[]; total: number }> {
    const where: any = {};

    if (filters?.category) {
      where.category = {
        startsWith: filters.category,
        mode: 'insensitive',
      };
    }

    if (filters?.lowStock) {
      // Use configurable low-stock threshold (falls back to 10 if not provided)
      where.stockQuantity = {
        lte: lowStockThreshold,
        gt: 0,
      };
      where.inStock = true;
    }

    if (filters?.outOfStock) {
      where.OR = [
        { stockQuantity: 0 },
        { inStock: false },
      ];
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { category: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const skip = pagination?.skip ?? 0;
    const take = pagination?.limit ?? 50;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { stockQuantity: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          category: true,
          price: true,
          stockQuantity: true,
          inStock: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Get last movement date and total movements for each product
    const productIds = products.map((p) => p.id);
    const movements = await prisma.stockMovement.groupBy({
      by: ['productId'],
      where: {
        productId: { in: productIds },
      },
      _count: {
        id: true,
      },
      _max: {
        createdAt: true,
      },
    });

    const movementsMap = new Map(
      movements.map((m) => [
        m.productId,
        {
          lastMovementDate: m._max.createdAt,
          totalMovements: m._count.id,
        },
      ])
    );

    const productInventory: ProductInventory[] = products.map((product) => ({
      ...product,
      lowStockThreshold: 10,
      lastMovementDate: movementsMap.get(product.id)?.lastMovementDate || undefined,
      totalMovements: movementsMap.get(product.id)?.totalMovements || 0,
    }));

    return { products: productInventory, total };
  }

  async getStockMovementById(id: string): Promise<StockMovement | null> {
    return prisma.stockMovement.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            category: true,
          },
        },
      },
    });
  }
}

