/**
 * Inventory domain types
 */

// Define StockMovementType as string literal union to avoid Prisma client dependency issues
export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN' | 'TRANSFER';

export interface StockMovement {
  id: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    image: string;
    category: string;
  };
  type: StockMovementType;
  quantity: number; // Positive for additions, negative for deductions
  previousStock: number;
  newStock: number;
  reason?: string | null;
  referenceId?: string | null;
  referenceType?: string | null;
  createdBy?: string | null;
  createdAt: Date;
}

export interface CreateStockMovementData {
  productId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  referenceId?: string;
  referenceType?: string;
  createdBy?: string;
}

export interface InventoryFilters {
  productId?: string;
  type?: StockMovementType;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface InventorySort {
  sortBy?: 'createdAt' | 'quantity' | 'productName';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
}

export interface InventoryStats {
  totalProducts: number;
  totalStockValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  recentMovements: number;
  stockValueByCategory: Array<{
    category: string;
    value: number;
    count: number;
  }>;
}

export interface ProductInventory {
  id: string;
  name: string;
  slug: string;
  image: string;
  category: string;
  price: number;
  stockQuantity: number;
  inStock: boolean;
  lowStockThreshold?: number;
  lastMovementDate?: Date;
  totalMovements?: number;
}

