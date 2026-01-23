/**
 * GET /api/v1/categories/[id] - Get category by ID
 * PUT /api/v1/categories/[id] - Update category
 * DELETE /api/v1/categories/[id] - Delete category
 */

import { NextRequest, NextResponse } from 'next/server';
import { CategoryService } from '@/src/domains/categories/services/category.service';
import { updateCategorySchema } from '@/src/domains/categories/validators/category.validator';
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
    const categoryService = new CategoryService();
    const category = await categoryService.getCategoryById(id);

    return NextResponse.json({
      success: true,
      data: category,
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
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const { id } = await params;
    
    logger.request('PUT', `/api/v1/categories/${id}`, ip);

    await requireAdminRole(request);

    const csrfValid = await validateCsrf(request);
    if (!csrfValid) {
      logger.security('CSRF validation failed', { path: `/api/v1/categories/${id}`, method: 'PUT', ip });
      return NextResponse.json(
        { success: false, error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateCategorySchema.parse(body);

    const categoryService = new CategoryService();
    const category = await categoryService.updateCategory(id, validatedData);

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      data: category,
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
    
    logger.request('DELETE', `/api/v1/categories/${id}`, ip);

    await requireAdminRole(request);

    const csrfValid = await validateCsrf(request);
    if (!csrfValid) {
      logger.security('CSRF validation failed', { path: `/api/v1/categories/${id}`, method: 'DELETE', ip });
      return NextResponse.json(
        { success: false, error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    const categoryService = new CategoryService();
    await categoryService.deleteCategory(id);

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

