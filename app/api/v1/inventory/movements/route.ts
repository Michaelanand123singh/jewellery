/**
 * GET /api/v1/inventory/movements - Get stock movements
 * POST /api/v1/inventory/movements - Create stock movement
 */

import { NextRequest, NextResponse } from 'next/server';
import { InventoryService } from '@/src/domains/inventory/services/inventory.service';
import { createStockMovementSchema, adjustStockSchema } from '@/src/domains/inventory/validators/inventory.validator';
import { StockMovementType } from '@/src/domains/inventory/types/inventory.types';
import { requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { logger } from '@/src/shared/utils/logger';
import { validateCsrf } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('GET', '/api/v1/inventory/movements', ip);

    // Require admin authentication
    await requireAdminRole(request);

    const { searchParams } = new URL(request.url);

    const filters = {
      productId: searchParams.get('productId') || undefined,
      type: searchParams.get('type') as any,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      search: searchParams.get('search') || undefined,
    };

    const sort = {
      sortBy: (searchParams.get('sortBy') || 'createdAt') as 'createdAt' | 'quantity' | 'productName',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    };

    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 per page, default 20
    const skip = (page - 1) * limit;

    const inventoryService = new InventoryService();
    const result = await inventoryService.getStockMovements(filters, sort, { page, limit, skip });

    return NextResponse.json({
      success: true,
      data: result.movements,
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

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('POST', '/api/v1/inventory/movements', ip);

    // Require admin authentication
    const user = await requireAdminRole(request);

    // Validate CSRF token
    const csrfValid = await validateCsrf(request);
    if (!csrfValid) {
      logger.security('CSRF validation failed', { path: '/api/v1/inventory/movements', method: 'POST', ip });
      return NextResponse.json(
        { success: false, error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Check if it's a stock adjustment (has quantity that can be positive or negative)
    if (body.quantity !== undefined && body.reason) {
      const validatedData = adjustStockSchema.parse(body);
      const inventoryService = new InventoryService();
      
      const movement = await inventoryService.adjustStock(
        validatedData.productId,
        validatedData.quantity,
        validatedData.reason,
        validatedData.type,
        user.id
      );

      return NextResponse.json({
        success: true,
        message: 'Stock adjusted successfully',
        data: movement,
      });
    } else {
      // Regular stock movement
      const validatedData = createStockMovementSchema.parse(body);
      const inventoryService = new InventoryService();
      
      const movement = await inventoryService.createStockMovement({
        ...validatedData,
        type: validatedData.type as StockMovementType,
        createdBy: user.id,
      });

      return NextResponse.json({
        success: true,
        message: 'Stock movement created successfully',
        data: movement,
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

