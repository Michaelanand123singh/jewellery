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

    const { searchParams } = new URL(request.url);
    const tree = searchParams.get('tree') === 'true';
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const categoryService = new CategoryService();
    const categories = tree
      ? await categoryService.getCategoryTree(includeInactive)
      : await categoryService.getAllCategories(includeInactive);

    return NextResponse.json({
      success: true,
      data: categories,
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

