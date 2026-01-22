/**
 * GET /api/v1/products - Get all products
 * POST /api/v1/products - Create product (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/src/domains/products/services/product.service';
import { createProductSchema } from '@/src/domains/products/validators/product.validator';
import { requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { logger } from '@/src/shared/utils/logger';
import { validateCsrf } from '@/lib/csrf';
import { sanitizeHtml } from '@/lib/sanitize';

export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('GET', '/api/v1/products', ip);

    const { searchParams } = new URL(request.url);

    const filters = {
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      inStock: searchParams.get('inStock') === 'true' ? true : undefined,
      rating: searchParams.get('rating') ? parseFloat(searchParams.get('rating')!) : undefined,
    };

    const sort = {
      sortBy: (searchParams.get('sortBy') || 'createdAt') as 'price' | 'name' | 'rating' | 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    };

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const productService = new ProductService();
    const result = await productService.getProducts(
      filters,
      sort,
      { page, limit, skip }
    );

    const response = NextResponse.json({
      success: true,
      data: result.products,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });

    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('POST', '/api/v1/products', ip);

    // Require admin authentication
    await requireAdminRole(request);

    // Validate CSRF token
    const csrfValid = await validateCsrf(request);
    if (!csrfValid) {
      logger.security('CSRF validation failed', { path: '/api/v1/products', method: 'POST', ip });
      return NextResponse.json(
        { success: false, error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createProductSchema.parse(body);

    // Sanitize HTML in description
    if (validatedData.description) {
      validatedData.description = sanitizeHtml(validatedData.description);
    }

    const productService = new ProductService();
    const product = await productService.createProduct(validatedData);

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

