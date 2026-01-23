/**
 * GET /api/v1/inventory/stats - Get inventory statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { InventoryService } from '@/src/domains/inventory/services/inventory.service';
import { requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { logger } from '@/src/shared/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('GET', '/api/v1/inventory/stats', ip);

    // Require admin authentication
    await requireAdminRole(request);

    const { searchParams } = new URL(request.url);
    const lowStockThreshold = parseInt(searchParams.get('lowStockThreshold') || '10');

    const inventoryService = new InventoryService();
    const stats = await inventoryService.getInventoryStats(lowStockThreshold);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

