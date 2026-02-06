/**
 * GET /api/v1/tags - Get all product tags
 * POST /api/v1/tags - Create tag (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProductTagRepository } from '@/src/domains/products/repositories/tag.repository';
import { createProductTagSchema } from '@/src/domains/products/validators/product.validator';
import { requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { logger } from '@/src/shared/utils/logger';
import { validateCsrf } from '@/lib/csrf';
import { slugify } from '@/src/shared/utils/formatters';

export async function GET(request: NextRequest) {
  try {
    const tagRepository = new ProductTagRepository();
    const tags = await tagRepository.findMany();

    return NextResponse.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('POST', '/api/v1/tags', ip);

    // Require admin authentication
    await requireAdminRole(request);

    // Validate CSRF token
    const csrfValid = await validateCsrf(request);
    if (!csrfValid) {
      logger.security('CSRF validation failed', { path: '/api/v1/tags', method: 'POST', ip });
      return NextResponse.json(
        { success: false, error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createProductTagSchema.parse({
      ...body,
      slug: body.slug || slugify(body.name),
    });

    const tagRepository = new ProductTagRepository();
    const tag = await tagRepository.create(validatedData);

    return NextResponse.json({
      success: true,
      message: 'Tag created successfully',
      data: tag,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

