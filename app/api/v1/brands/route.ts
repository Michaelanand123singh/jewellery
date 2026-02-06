/**
 * GET /api/v1/brands - Get all brands
 * POST /api/v1/brands - Create brand (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { BrandRepository } from '@/src/domains/products/repositories/brand.repository';
import { createBrandSchema } from '@/src/domains/products/validators/product.validator';
import { requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { logger } from '@/src/shared/utils/logger';
import { validateCsrf } from '@/lib/csrf';
import { slugify } from '@/src/shared/utils/formatters';

export async function GET(request: NextRequest) {
  try {
    const brandRepository = new BrandRepository();
    const brands = await brandRepository.findMany();

    return NextResponse.json({
      success: true,
      data: brands,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('POST', '/api/v1/brands', ip);

    // Require admin authentication
    await requireAdminRole(request);

    // Validate CSRF token
    const csrfValid = await validateCsrf(request);
    if (!csrfValid) {
      logger.security('CSRF validation failed', { path: '/api/v1/brands', method: 'POST', ip });
      return NextResponse.json(
        { success: false, error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createBrandSchema.parse({
      ...body,
      slug: body.slug || slugify(body.name),
    });

    const brandRepository = new BrandRepository();
    const brand = await brandRepository.create(validatedData);

    return NextResponse.json({
      success: true,
      message: 'Brand created successfully',
      data: brand,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

