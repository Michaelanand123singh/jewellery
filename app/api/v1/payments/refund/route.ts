/**
 * POST /api/v1/payments/refund
 * Process refund (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { PaymentService } from '@/src/domains/payments/services/payment.service';
import { refundSchema } from '@/src/domains/payments/validators/payment.validator';
import { handleApiError } from '@/src/shared/middleware/error.middleware';

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin(request);

    const body = await request.json();
    const data = refundSchema.parse(body);

    const paymentService = new PaymentService();
    
    const refund = await paymentService.processRefund({
      paymentId: data.paymentId,
      amount: data.amount,
      notes: data.notes,
    }, adminUser.id);

    return NextResponse.json({
      success: true,
      data: refund,
      message: 'Refund processed successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

