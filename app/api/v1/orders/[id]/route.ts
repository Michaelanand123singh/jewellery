/**
 * GET /api/v1/orders/[id] - Get order by ID
 * PUT /api/v1/orders/[id] - Update order status (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/src/domains/orders/services/order.service';
import { requireAuth, requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { z } from 'zod';
import { OrderStatus } from '@/src/shared/constants/order-status';
import { PaymentStatus } from '@/src/shared/constants/payment-methods';

const updateOrderSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const orderService = new OrderService();
    // Users can only see their own orders, admins can see all
    const order = await orderService.getOrderById(
      id,
      user.role !== 'ADMIN' ? user.id : undefined
    );

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminRole(request);
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateOrderSchema.parse(body);

    const orderService = new OrderService();
    const order = await orderService.updateOrderStatus(id, validatedData);

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      data: order,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

