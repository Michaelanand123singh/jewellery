/**
 * GET /api/v1/addresses - Get user's addresses
 * POST /api/v1/addresses - Create address
 */

import { NextRequest, NextResponse } from 'next/server';
import { AddressService } from '@/src/domains/addresses/services/address.service';
import { createAddressSchema } from '@/src/domains/addresses/validators/address.validator';
import { requireAuth } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const addressService = new AddressService();
    const addresses = await addressService.getAddressesByUserId(user.id);

    return NextResponse.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const validatedData = createAddressSchema.parse(body);

    const addressService = new AddressService();
    const address = await addressService.createAddress({
      ...validatedData,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Address created successfully',
      data: address,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

