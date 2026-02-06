/**
 * GET /api/v1/inventory/products - Get product inventory list
 */

import { NextRequest, NextResponse } from 'next/server';
import { InventoryService } from '@/src/domains/inventory/services/inventory.service';
import { requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { logger } from '@/src/shared/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('GET', '/api/v1/inventory/products', ip);

    // Require admin authentication
    await requireAdminRole(request);

    const { searchParams } = new URL(request.url);

    const filters = {
      category: searchParams.get('category') || undefined,
      lowStock: searchParams.get('lowStock') === 'true',
      outOfStock: searchParams.get('outOfStock') === 'true',
      search: searchParams.get('search') || undefined,
    };

    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 per page, default 20
    const skip = (page - 1) * limit;

    const inventoryService = new InventoryService();
    const result = await inventoryService.getProductInventory(filters, { page, limit, skip });

    return NextResponse.json({
      success: true,
      data: result.products,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

