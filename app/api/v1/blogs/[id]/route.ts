/**
 * GET /api/v1/blogs/[id] - Get blog by ID
 * PUT /api/v1/blogs/[id] - Update blog (admin only)
 * DELETE /api/v1/blogs/[id] - Delete blog (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { BlogService } from '@/src/domains/blogs/services/blog.service';
import { updateBlogSchema } from '@/src/domains/blogs/validators/blog.validator';
import { requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { logger } from '@/src/shared/utils/logger';
import { validateCsrf } from '@/lib/csrf';
import { sanitizeHtml } from '@/lib/sanitize';

export const revalidate = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('GET', `/api/v1/blogs/${id}`, ip);

    const blogService = new BlogService();
    const blog = await blogService.getBlogById(id);

    const response = NextResponse.json({
      success: true,
      data: blog,
    });

    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
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
    const { id } = await params;
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('PUT', `/api/v1/blogs/${id}`, ip);

    // Require admin authentication
    await requireAdminRole(request);

    // Validate CSRF token
    const csrfValid = await validateCsrf(request);
    if (!csrfValid) {
      logger.security('CSRF validation failed', { path: `/api/v1/blogs/${id}`, method: 'PUT', ip });
      return NextResponse.json(
        { success: false, error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateBlogSchema.parse(body);

    // Sanitize HTML in content
    if (validatedData.content) {
      validatedData.content = sanitizeHtml(validatedData.content);
    }

    const blogService = new BlogService();
    const blog = await blogService.updateBlog(id, validatedData);

    return NextResponse.json({
      success: true,
      message: 'Blog updated successfully',
      data: blog,
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
    const { id } = await params;
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('DELETE', `/api/v1/blogs/${id}`, ip);

    // Require admin authentication
    await requireAdminRole(request);

    // Validate CSRF token
    const csrfValid = await validateCsrf(request);
    if (!csrfValid) {
      logger.security('CSRF validation failed', { path: `/api/v1/blogs/${id}`, method: 'DELETE', ip });
      return NextResponse.json(
        { success: false, error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    const blogService = new BlogService();
    await blogService.deleteBlog(id);

    return NextResponse.json({
      success: true,
      message: 'Blog deleted successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

