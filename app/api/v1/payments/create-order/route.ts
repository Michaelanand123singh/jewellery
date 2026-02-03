/**
 * POST /api/v1/payments/create-order
 * Create Razorpay order for payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { PaymentService } from '@/src/domains/payments/services/payment.service';
import { OrderRepository } from '@/src/domains/orders/repositories/order.repository';
import { createPaymentSchema } from '@/src/domains/payments/validators/payment.validator';
import { PaymentGateway } from '@/src/domains/payments/types/payment.types';
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
    const data = createPaymentSchema.parse(body);

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

    // Create payment
    const paymentService = new PaymentService();
    const result = await paymentService.createPayment({
      orderId: data.orderId,
      amount: order.total,
      currency: 'INR',
      gateway: data.gateway as PaymentGateway,
    });

    // PHASE 8: Remove key ID from response (security best practice)
    // Frontend should use environment variable or separate config
    return NextResponse.json({
      success: true,
      data: {
        payment: result.payment,
        razorpayOrder: result.razorpayOrder,
        // Note: keyId removed - frontend should use env variable
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

