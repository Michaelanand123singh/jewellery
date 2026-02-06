import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { OrderService } from '@/src/domains/orders/services/order.service';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { z } from 'zod';

// POST /api/checkout - Create order from cart
// Uses OrderService which handles variant stock properly
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const checkoutData = z
      .object({
        addressId: z.string(),
        paymentMethod: z.string(),
        paymentId: z.string().optional(),
        notes: z.string().optional(),
      })
      .parse(body);

    // Use OrderService which handles variant stock properly
    const orderService = new OrderService();
    const order = await orderService.createOrder({
      userId: user.id,
      addressId: checkoutData.addressId,
      paymentMethod: checkoutData.paymentMethod as any,
      paymentId: checkoutData.paymentId,
      notes: checkoutData.notes,
    });

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully',
      data: order,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
