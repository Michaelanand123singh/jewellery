/**
 * GET /api/v1/cart - Get user's cart
 * POST /api/v1/cart - Add item to cart
 * DELETE /api/v1/cart - Clear cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { CartService } from '@/src/domains/cart/services/cart.service';
import { requireAuth } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { z } from 'zod';

const addToCartSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive().default(1),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const cartService = new CartService();
    const cartItems = await cartService.getCart(user.id);

    return NextResponse.json({
      success: true,
      data: { items: cartItems },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const validatedData = addToCartSchema.parse(body);

    const cartService = new CartService();
    const cartItem = await cartService.addToCart({
      userId: user.id,
      productId: validatedData.productId,
      quantity: validatedData.quantity,
    });

    return NextResponse.json({
      success: true,
      message: 'Item added to cart',
      data: cartItem,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const cartService = new CartService();
    await cartService.clearCart(user.id);

    return NextResponse.json({
      success: true,
      message: 'Cart cleared',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

