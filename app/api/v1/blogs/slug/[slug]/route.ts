/**
 * GET /api/v1/blogs/slug/[slug] - Get blog by slug
 */

import { NextRequest, NextResponse } from 'next/server';
import { BlogService } from '@/src/domains/blogs/services/blog.service';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { logger } from '@/src/shared/utils/logger';
import { getAuthUser } from '@/lib/auth';

export const revalidate = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('GET', `/api/v1/blogs/slug/${slug}`, ip);

    const blogService = new BlogService();
    const blog = await blogService.getBlogBySlug(slug);

    if (!blog) {
      return NextResponse.json(
        { success: false, error: 'Blog not found' },
        { status: 404 }
      );
    }

    // Check if user is admin - admins can see unpublished blogs
    let isAdmin = false;
    try {
      const user = await getAuthUser(request);
      isAdmin = user?.role === 'ADMIN';
    } catch {
      // User is not authenticated or not admin - check published status
    }

    // If blog is not published and user is not admin, return 404
    if (!blog.published && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Blog not found' },
        { status: 404 }
      );
    }

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

