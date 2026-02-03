/**
 * GET /api/v1/orders - Get orders (user's orders or all orders for admin)
 * POST /api/v1/orders - Create order
 */

import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/src/domains/orders/services/order.service';
import { requireAuth, requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { z } from 'zod';
import { PaymentMethod } from '@/src/shared/constants/payment-methods';

const createOrderSchema = z.object({
  addressId: z.string(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build filters
    const filters: any = {};
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status');
    }
    if (searchParams.get('paymentStatus')) {
      filters.paymentStatus = searchParams.get('paymentStatus');
    }
    if (searchParams.get('paymentMethod')) {
      filters.paymentMethod = searchParams.get('paymentMethod');
    }
    if (searchParams.get('startDate')) {
      filters.startDate = new Date(searchParams.get('startDate')!);
    }
    if (searchParams.get('endDate')) {
      filters.endDate = new Date(searchParams.get('endDate')!);
    }
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search');
    }
    if (searchParams.get('userId')) {
      filters.userId = searchParams.get('userId');
    }

    // Build sort
    const sort: any = {};
    if (searchParams.get('sortBy')) {
      sort.sortBy = searchParams.get('sortBy');
    }
    if (searchParams.get('sortOrder')) {
      sort.sortOrder = searchParams.get('sortOrder');
    }

    const orderService = new OrderService();
    
    // Admin can see all orders with filters, users see only their orders
    const isAdmin = user.role === 'ADMIN';
    const result = isAdmin
      ? await orderService.getAllOrders(filters, sort, { page, limit, skip })
      : await orderService.getOrdersByUserId(user.id, { page, limit, skip });

    return NextResponse.json({
      success: true,
      data: result.orders,
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
    const validatedData = createOrderSchema.parse(body);

    const orderService = new OrderService();
    const order = await orderService.createOrder({
      userId: user.id,
      addressId: validatedData.addressId,
      paymentMethod: validatedData.paymentMethod,
      paymentId: validatedData.paymentId,
      notes: validatedData.notes,
    });

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

