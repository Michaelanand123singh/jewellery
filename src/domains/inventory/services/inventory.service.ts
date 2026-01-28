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
  StockMovementType,
} from '../types/inventory.types';
import { NotFoundError } from '@/src/shared/utils/errors';
import { SettingsService } from '@/src/domains/settings/services/settings.service';

export class InventoryService {
  private inventoryRepository: InventoryRepository;
  private settingsService: SettingsService;

  constructor() {
    this.inventoryRepository = new InventoryRepository();
    this.settingsService = new SettingsService();
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
    const movementType: StockMovementType = quantity > 0 
      ? 'IN' 
      : type === 'ADJUSTMENT' 
        ? 'ADJUSTMENT' 
        : 'OUT';

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

  async getInventoryStats(lowStockThreshold?: number): Promise<InventoryStats> {
    // If caller didn't provide a threshold, fall back to product settings
    let effectiveThreshold = lowStockThreshold;

    if (effectiveThreshold === undefined) {
      const productSettings = await this.settingsService.getProductSettings();
      effectiveThreshold = productSettings.defaultStockThreshold;
    }

    return this.inventoryRepository.getInventoryStats(effectiveThreshold);
  }

  async getProductInventory(
    filters?: { category?: string; lowStock?: boolean; outOfStock?: boolean; search?: string },
    pagination?: PaginationParams
  ): Promise<{ products: ProductInventory[]; total: number; totalPages: number }> {
    // Load low-stock threshold from settings only when needed
    let lowStockThreshold: number | undefined;
    if (filters?.lowStock) {
      const productSettings = await this.settingsService.getProductSettings();
      lowStockThreshold = productSettings.defaultStockThreshold;
    }

    const { products, total } = await this.inventoryRepository.getProductInventory(
      filters,
      pagination,
      lowStockThreshold
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

