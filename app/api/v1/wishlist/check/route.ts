/**
 * GET /api/v1/wishlist/check?productId=xxx - Check if product is in wishlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { WishlistService } from '@/src/domains/wishlist/services/wishlist.service';
import { requireAuth } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'productId is required' },
        { status: 400 }
      );
    }

    const wishlistService = new WishlistService();
    const isInWishlist = await wishlistService.isInWishlist(user.id, productId);

    return NextResponse.json({
      success: true,
      data: { isInWishlist },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

