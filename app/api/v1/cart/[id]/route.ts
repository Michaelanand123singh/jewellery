/**
 * PUT /api/v1/cart/[id] - Update cart item
 * DELETE /api/v1/cart/[id] - Remove cart item
 */

import { NextRequest, NextResponse } from 'next/server';
import { CartService } from '@/src/domains/cart/services/cart.service';
import { requireAuth } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { z } from 'zod';

const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateCartItemSchema.parse(body);

    const cartService = new CartService();
    const cartItem = await cartService.updateCartItem(user.id, id, validatedData);

    return NextResponse.json({
      success: true,
      message: 'Cart item updated',
      data: cartItem,
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

    const cartService = new CartService();
    await cartService.removeFromCart(user.id, id);

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

