/**
 * GET /api/v1/products/[id] - Get product by ID
 * PUT /api/v1/products/[id] - Update product (admin only)
 * DELETE /api/v1/products/[id] - Delete product (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/src/domains/products/services/product.service';
import { updateProductSchema } from '@/src/domains/products/validators/product.validator';
import { requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { logger } from '@/src/shared/utils/logger';
import { validateCsrf } from '@/lib/csrf';
import { sanitizeHtml } from '@/lib/sanitize';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productService = new ProductService();
    const product = await productService.getProductById(id);

    // Fetch reviews for the product (matching /api/products/[id] behavior)
    const { prisma } = await import('@/lib/prisma');
    const reviews = await prisma.review.findMany({
      where: { productId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        ...product,
        reviews,
      },
    });

    // Add cache headers (60 seconds cache, allow stale for 120 seconds)
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const { id } = await params;
    
    logger.request('PUT', `/api/v1/products/${id}`, ip);

    // Require admin authentication
    await requireAdminRole(request);

    // Validate CSRF token
    const csrfValid = await validateCsrf(request);
    if (!csrfValid) {
      logger.security('CSRF validation failed', { path: `/api/v1/products/${id}`, method: 'PUT', ip });
      return NextResponse.json(
        { success: false, error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    // Sanitize HTML in description
    if (validatedData.description) {
      validatedData.description = sanitizeHtml(validatedData.description);
    }

    const productService = new ProductService();
    const product = await productService.updateProduct(id, validatedData);

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
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
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const { id } = await params;
    
    logger.request('DELETE', `/api/v1/products/${id}`, ip);

    // Require admin authentication
    await requireAdminRole(request);

    // Validate CSRF token
    const csrfValid = await validateCsrf(request);
    if (!csrfValid) {
      logger.security('CSRF validation failed', { path: `/api/v1/products/${id}`, method: 'DELETE', ip });
      return NextResponse.json(
        { success: false, error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    const productService = new ProductService();
    await productService.deleteProduct(id);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

