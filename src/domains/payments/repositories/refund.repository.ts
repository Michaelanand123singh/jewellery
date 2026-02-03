/**
 * Refund repository - Data access layer for refunds
 */

import { prisma } from '@/src/infrastructure/database/prisma';

export interface Refund {
  id: string;
  paymentId: string;
  razorpayRefundId: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string | null;
  notes?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRefundData {
  paymentId: string;
  razorpayRefundId: string;
  amount: number;
  currency?: string;
  status: string;
  reason?: string;
  notes?: any;
}

export class RefundRepository {
  async findByRazorpayRefundId(refundId: string): Promise<Refund | null> {
    return (prisma as any).refund.findUnique({
      where: { razorpayRefundId: refundId },
    }) as unknown as Refund | null;
  }

  async findByPaymentId(paymentId: string): Promise<Refund[]> {
    return (prisma as any).refund.findMany({
      where: { paymentId },
      orderBy: { createdAt: 'desc' },
    }) as unknown as Refund[];
  }

  async create(data: CreateRefundData): Promise<Refund> {
    return (prisma as any).refund.create({
      data: {
        paymentId: data.paymentId,
        razorpayRefundId: data.razorpayRefundId,
        amount: data.amount,
        currency: data.currency || 'INR',
        status: data.status,
        reason: data.reason,
        notes: data.notes,
      },
    }) as unknown as Refund;
  }

  async update(id: string, data: Partial<Refund>): Promise<Refund> {
    return (prisma as any).refund.update({
      where: { id },
      data,
    }) as unknown as Refund;
  }

  async getTotalRefundedAmount(paymentId: string): Promise<number> {
    const refunds = await this.findByPaymentId(paymentId);
    return refunds
      .filter((r) => r.status === 'processed' || r.status === 'success')
      .reduce((sum, r) => sum + r.amount, 0);
  }
}

