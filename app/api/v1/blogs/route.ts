/**
 * GET /api/v1/blogs - Get all blogs
 * POST /api/v1/blogs - Create blog (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { BlogService } from '@/src/domains/blogs/services/blog.service';
import { createBlogSchema } from '@/src/domains/blogs/validators/blog.validator';
import { requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { logger } from '@/src/shared/utils/logger';
import { validateCsrf } from '@/lib/csrf';
import { sanitizeHtml } from '@/lib/sanitize';

export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('GET', '/api/v1/blogs', ip);

    const { searchParams } = new URL(request.url);

    // Check if user is admin - admins can see all blogs
    let isAdmin = false;
    try {
      const { getAuthUser } = await import('@/lib/auth');
      const user = await getAuthUser(request);
      isAdmin = user?.role === 'ADMIN';
    } catch {
      // User is not authenticated - will only see published blogs
    }

    // For non-admin users, default to published=true if not explicitly set
    const publishedParam = searchParams.get('published');
    let publishedFilter: boolean | undefined;
    
    if (publishedParam === 'true') {
      publishedFilter = true;
    } else if (publishedParam === 'false') {
      // Only admins can explicitly request unpublished blogs
      publishedFilter = isAdmin ? false : undefined;
    } else if (!isAdmin) {
      // Non-admin users default to published blogs only
      publishedFilter = true;
    }
    // If admin and no published param, show all blogs (undefined = no filter)

    const filters = {
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      published: publishedFilter,
      author: searchParams.get('author') || undefined,
    };

    const sort = {
      sortBy: (searchParams.get('sortBy') || 'createdAt') as 'title' | 'createdAt' | 'publishedAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    };

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const blogService = new BlogService();
    const result = await blogService.getBlogs(
      filters,
      sort,
      { page, limit, skip }
    );

    const response = NextResponse.json({
      success: true,
      data: result.blogs,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });

    // No cache for blog listings to ensure admin updates are visible immediately
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('POST', '/api/v1/blogs', ip);

    // Require admin authentication
    await requireAdminRole(request);

    // Validate CSRF token
    const csrfValid = await validateCsrf(request);
    if (!csrfValid) {
      logger.security('CSRF validation failed', { path: '/api/v1/blogs', method: 'POST', ip });
      return NextResponse.json(
        { success: false, error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createBlogSchema.parse(body);

    // Sanitize HTML in content
    if (validatedData.content) {
      validatedData.content = sanitizeHtml(validatedData.content);
    }

    const blogService = new BlogService();
    const blog = await blogService.createBlog(validatedData);

    return NextResponse.json({
      success: true,
      message: 'Blog created successfully',
      data: blog,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

