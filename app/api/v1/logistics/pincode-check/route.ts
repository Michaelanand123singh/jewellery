/**
 * GET /api/v1/logistics/pincode-check
 * Check pincode serviceability
 */

import { NextRequest, NextResponse } from 'next/server';
import { LogisticsService } from '@/src/domains/logistics/services/logistics.service';
import { checkServiceabilitySchema } from '@/src/domains/logistics/validators/logistics.validator';
import { handleApiError } from '@/src/shared/middleware/error.middleware';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const data = checkServiceabilitySchema.parse({
      pickupPincode: searchParams.get('pickupPincode'),
      deliveryPincode: searchParams.get('deliveryPincode'),
      weight: searchParams.get('weight') ? parseFloat(searchParams.get('weight')!) : undefined,
      codAmount: searchParams.get('codAmount') ? parseFloat(searchParams.get('codAmount')!) : undefined,
    });

    const logisticsService = new LogisticsService();
    const result = await logisticsService.checkServiceability(
      data.pickupPincode,
      data.deliveryPincode,
      data.weight,
      data.codAmount
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

