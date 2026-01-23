/**
 * Inventory service - Business logic for inventory management
 */

import { InventoryRepository } from '../repositories/inventory.repository';
import {
  StockMovement,
  CreateStockMovementData,
  InventoryFilters,
  InventorySort,
  PaginationParams,
  InventoryStats,
  ProductInventory,
} from '../types/inventory.types';
import { $Enums } from '@prisma/client';
import { NotFoundError } from '@/src/shared/utils/errors';

export class InventoryService {
  private inventoryRepository: InventoryRepository;

  constructor() {
    this.inventoryRepository = new InventoryRepository();
  }

  async createStockMovement(data: CreateStockMovementData): Promise<StockMovement> {
    return this.inventoryRepository.createStockMovement(data);
  }

  async adjustStock(
    productId: string,
    quantity: number,
    reason: string,
    type: 'IN' | 'OUT' | 'ADJUSTMENT' = 'ADJUSTMENT',
    createdBy?: string
  ): Promise<StockMovement> {
    // For adjustments, quantity can be positive (add) or negative (remove)
    // But we need to ensure it's positive for the movement type
    const absQuantity = Math.abs(quantity);
    const movementType = quantity > 0 
      ? $Enums.StockMovementType.IN 
      : type === 'ADJUSTMENT' 
        ? $Enums.StockMovementType.ADJUSTMENT 
        : $Enums.StockMovementType.OUT;

    return this.inventoryRepository.createStockMovement({
      productId,
      type: movementType,
      quantity: absQuantity,
      reason,
      createdBy,
    });
  }

  async getStockMovements(
    filters?: InventoryFilters,
    sort?: InventorySort,
    pagination?: PaginationParams
  ): Promise<{ movements: StockMovement[]; total: number; totalPages: number }> {
    const { movements, total } = await this.inventoryRepository.findStockMovements(
      filters,
      sort,
      pagination
    );

    const limit = pagination?.limit ?? 50;
    const totalPages = Math.ceil(total / limit);

    return { movements, total, totalPages };
  }

  async getInventoryStats(lowStockThreshold: number = 10): Promise<InventoryStats> {
    return this.inventoryRepository.getInventoryStats(lowStockThreshold);
  }

  async getProductInventory(
    filters?: { category?: string; lowStock?: boolean; outOfStock?: boolean; search?: string },
    pagination?: PaginationParams
  ): Promise<{ products: ProductInventory[]; total: number; totalPages: number }> {
    const { products, total } = await this.inventoryRepository.getProductInventory(
      filters,
      pagination
    );

    const limit = pagination?.limit ?? 50;
    const totalPages = Math.ceil(total / limit);

    return { products, total, totalPages };
  }

  async getStockMovementById(id: string): Promise<StockMovement> {
    const movement = await this.inventoryRepository.getStockMovementById(id);
    if (!movement) {
      throw new NotFoundError('Stock movement');
    }
    return movement;
  }
}

