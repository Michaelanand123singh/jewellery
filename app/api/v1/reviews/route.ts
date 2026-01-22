/**
 * GET /api/v1/reviews - Get reviews (by productId)
 * POST /api/v1/reviews - Create review
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReviewService } from '@/src/domains/reviews/services/review.service';
import { createReviewSchema } from '@/src/domains/reviews/validators/review.validator';
import { requireAuth } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'productId is required' },
        { status: 400 }
      );
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const reviewService = new ReviewService();
    const result = await reviewService.getReviewsByProductId(productId, { page, limit, skip });

    return NextResponse.json({
      success: true,
      data: result.reviews,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const validatedData = createReviewSchema.parse(body);

    const reviewService = new ReviewService();
    const review = await reviewService.createReview({
      userId: user.id,
      productId: validatedData.productId,
      rating: validatedData.rating,
      comment: validatedData.comment,
    });

    return NextResponse.json({
      success: true,
      message: 'Review created successfully',
      data: review,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

