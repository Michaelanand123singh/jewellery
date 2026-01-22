/**
 * GET /api/v1/blogs/slug/[slug] - Get blog by slug
 */

import { NextRequest, NextResponse } from 'next/server';
import { BlogService } from '@/src/domains/blogs/services/blog.service';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { logger } from '@/src/shared/utils/logger';

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

