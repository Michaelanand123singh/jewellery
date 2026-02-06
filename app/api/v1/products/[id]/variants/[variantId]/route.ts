/**
 * PUT /api/v1/products/[id]/variants/[variantId] - Update variant (admin only)
 * DELETE /api/v1/products/[id]/variants/[variantId] - Delete variant (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProductVariantRepository } from '@/src/domains/products/repositories/variant.repository';
import { updateProductVariantSchema } from '@/src/domains/products/validators/product.validator';
import { requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { logger } from '@/src/shared/utils/logger';
import { validateCsrf } from '@/lib/csrf';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const { variantId } = await params;
    
    logger.request('PUT', `/api/v1/products/${variantId}/variants/${variantId}`, ip);

    // Require admin authentication
    await requireAdminRole(request);

    // Validate CSRF token
    const csrfValid = await validateCsrf(request);
    if (!csrfValid) {
      logger.security('CSRF validation failed', { path: `/api/v1/products/${variantId}/variants/${variantId}`, method: 'PUT', ip });
      return NextResponse.json(
        { success: false, error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateProductVariantSchema.parse(body);

    const variantRepository = new ProductVariantRepository();
    const variant = await variantRepository.update(variantId, validatedData);

    return NextResponse.json({
      success: true,
      message: 'Variant updated successfully',
      data: variant,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const { variantId } = await params;
    
    logger.request('DELETE', `/api/v1/products/${variantId}/variants/${variantId}`, ip);

    // Require admin authentication
    await requireAdminRole(request);

    // Validate CSRF token
    const csrfValid = await validateCsrf(request);
    if (!csrfValid) {
      logger.security('CSRF validation failed', { path: `/api/v1/products/${variantId}/variants/${variantId}`, method: 'DELETE', ip });
      return NextResponse.json(
        { success: false, error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    const variantRepository = new ProductVariantRepository();
    await variantRepository.delete(variantId);

    return NextResponse.json({
      success: true,
      message: 'Variant deleted successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

