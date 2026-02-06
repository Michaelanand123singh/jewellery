/**
 * POST /api/v1/payments/verify
 * Verify Razorpay payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { PaymentService } from '@/src/domains/payments/services/payment.service';
import { verifyPaymentSchema } from '@/src/domains/payments/validators/payment.validator';
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
    const data = verifyPaymentSchema.parse(body);

    const paymentService = new PaymentService();
    const payment = await paymentService.verifyPayment(
      data.paymentId,
      data.razorpayPaymentId,
      data.signature
    );

    return NextResponse.json({
      success: true,
      data: payment,
      message: 'Payment verified successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

