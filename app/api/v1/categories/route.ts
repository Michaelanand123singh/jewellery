/**
 * GET /api/v1/categories - Get all categories
 * POST /api/v1/categories - Create category
 */

import { NextRequest, NextResponse } from 'next/server';
import { CategoryService } from '@/src/domains/categories/services/category.service';
import { createCategorySchema } from '@/src/domains/categories/validators/category.validator';
import { requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { logger } from '@/src/shared/utils/logger';
import { validateCsrf } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('GET', '/api/v1/categories', ip);

    // Check if user is admin
    let isAdmin = false;
    try {
      const { getAuthUser } = await import('@/lib/auth');
      const user = await getAuthUser(request);
      isAdmin = user?.role === 'ADMIN';
    } catch {
      // Not authenticated - will only see active categories
    }

    const { searchParams } = new URL(request.url);
    const tree = searchParams.get('tree') === 'true';
    const includeInactive = isAdmin && searchParams.get('includeInactive') === 'true';
    
    // Simplified: Frontend shows all active categories by default
    // Admin can explicitly request onlyNavCategories=true if needed
    const onlyNavCategories = searchParams.get('onlyNavCategories') === 'true';

    const categoryService = new CategoryService();
    const categories = tree
      ? await categoryService.getCategoryTree(includeInactive, onlyNavCategories)
      : await categoryService.getAllCategories(includeInactive, onlyNavCategories);

    // Transform image URLs to use proxy for frontend access
    const categoriesWithProxyUrls = categories.map(category => ({
      ...category,
      image: category.image ? categoryService.transformImageUrl(category.image) : category.image,
    }));

    return NextResponse.json({
      success: true,
      data: categoriesWithProxyUrls,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('POST', '/api/v1/categories', ip);

    await requireAdminRole(request);

    const csrfValid = await validateCsrf(request);
    if (!csrfValid) {
      logger.security('CSRF validation failed', { path: '/api/v1/categories', method: 'POST', ip });
      return NextResponse.json(
        { success: false, error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createCategorySchema.parse(body);

    const categoryService = new CategoryService();
    const category = await categoryService.createCategory(validatedData);

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

