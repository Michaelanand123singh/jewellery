/**
 * POST /api/v1/payments/cod
 * Process Cash on Delivery payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { PaymentService } from '@/src/domains/payments/services/payment.service';
import { OrderRepository } from '@/src/domains/orders/repositories/order.repository';
import { processCODSchema } from '@/src/domains/payments/validators/payment.validator';
import { handleApiError } from '@/src/shared/middleware/error.middleware';

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
    const data = processCODSchema.parse(body);

    // Verify order belongs to user
    const orderRepository = new OrderRepository();
    const order = await orderRepository.findById(data.orderId);
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Process COD
    const paymentService = new PaymentService();
    const payment = await paymentService.processCOD(data.orderId);

    return NextResponse.json({
      success: true,
      data: payment,
      message: 'COD payment processed successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

