/**
 * GET /api/v1/addresses/[id] - Get address by ID
 * PUT /api/v1/addresses/[id] - Update address
 * DELETE /api/v1/addresses/[id] - Delete address
 */

import { NextRequest, NextResponse } from 'next/server';
import { AddressService } from '@/src/domains/addresses/services/address.service';
import { updateAddressSchema } from '@/src/domains/addresses/validators/address.validator';
import { requireAuth } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const addressService = new AddressService();
    const address = await addressService.getAddressById(id, user.id);

    return NextResponse.json({
      success: true,
      data: address,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateAddressSchema.parse(body);

    const addressService = new AddressService();
    const address = await addressService.updateAddress(id, user.id, validatedData);

    return NextResponse.json({
      success: true,
      message: 'Address updated successfully',
      data: address,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const addressService = new AddressService();
    await addressService.deleteAddress(id, user.id);

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

