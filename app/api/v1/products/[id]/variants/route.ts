/**
 * GET /api/v1/products/[id]/variants - Get all variants for a product
 * POST /api/v1/products/[id]/variants - Create a variant (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProductVariantRepository } from '@/src/domains/products/repositories/variant.repository';
import { createProductVariantSchema } from '@/src/domains/products/validators/product.validator';
import { requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { logger } from '@/src/shared/utils/logger';
import { validateCsrf } from '@/lib/csrf';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const variantRepository = new ProductVariantRepository();
    const variants = await variantRepository.findByProductId(id);

    return NextResponse.json({
      success: true,
      data: variants,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const { id } = await params;
    
    logger.request('POST', `/api/v1/products/${id}/variants`, ip);

    // Require admin authentication
    await requireAdminRole(request);

    // Validate CSRF token
    const csrfValid = await validateCsrf(request);
    if (!csrfValid) {
      logger.security('CSRF validation failed', { path: `/api/v1/products/${id}/variants`, method: 'POST', ip });
      return NextResponse.json(
        { success: false, error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createProductVariantSchema.parse({
      ...body,
      productId: id,
    });

    const variantRepository = new ProductVariantRepository();
    const variant = await variantRepository.create(validatedData);

    return NextResponse.json({
      success: true,
      message: 'Variant created successfully',
      data: variant,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

