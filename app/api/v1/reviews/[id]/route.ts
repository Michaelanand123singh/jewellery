/**
 * PUT /api/v1/reviews/[id] - Update review
 * DELETE /api/v1/reviews/[id] - Delete review
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReviewService } from '@/src/domains/reviews/services/review.service';
import { updateReviewSchema } from '@/src/domains/reviews/validators/review.validator';
import { requireAuth } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateReviewSchema.parse(body);

    const reviewService = new ReviewService();
    const review = await reviewService.updateReview(id, user.id, validatedData);

    return NextResponse.json({
      success: true,
      message: 'Review updated successfully',
      data: review,
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
    const user = await requireAuth(request);
    const { id } = await params;

    const reviewService = new ReviewService();
    await reviewService.deleteReview(id, user.id);

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

