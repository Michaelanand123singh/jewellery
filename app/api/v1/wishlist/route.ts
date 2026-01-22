/**
 * GET /api/v1/wishlist - Get user's wishlist
 * POST /api/v1/wishlist - Add item to wishlist
 * DELETE /api/v1/wishlist - Remove item from wishlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { WishlistService } from '@/src/domains/wishlist/services/wishlist.service';
import { requireAuth } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { z } from 'zod';

const addToWishlistSchema = z.object({
  productId: z.string(),
});

const removeFromWishlistSchema = z.object({
  productId: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const wishlistService = new WishlistService();
    const wishlist = await wishlistService.getWishlist(user.id);

    return NextResponse.json({
      success: true,
      data: { items: wishlist },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const validatedData = addToWishlistSchema.parse(body);

    const wishlistService = new WishlistService();
    const item = await wishlistService.addToWishlist(user.id, validatedData.productId);

    return NextResponse.json({
      success: true,
      message: 'Item added to wishlist',
      data: item,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
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
    await wishlistService.removeFromWishlist(user.id, productId);

    return NextResponse.json({
      success: true,
      message: 'Item removed from wishlist',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

