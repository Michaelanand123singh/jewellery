/**
 * POST /api/v1/logistics/create-shipment
 * Create shipment for an order (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { LogisticsService } from '@/src/domains/logistics/services/logistics.service';
import { createShipmentSchema } from '@/src/domains/logistics/validators/logistics.validator';
import { handleApiError } from '@/src/shared/middleware/error.middleware';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const data = createShipmentSchema.parse(body);

    const logisticsService = new LogisticsService();
    const shipment = await logisticsService.createShipment(data.orderId, data.courierId);

    return NextResponse.json({
      success: true,
      data: shipment,
      message: 'Shipment created successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

