/**
 * Payment repository - Data access layer for payments
 */

import { prisma } from '@/src/infrastructure/database/prisma';
import { Payment, CreatePaymentData } from '../types/payment.types';

export class PaymentRepository {
  async findById(id: string): Promise<Payment | null> {
    return (prisma as any).payment.findUnique({
      where: { id },
    }) as unknown as Payment | null;
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    return (prisma as any).payment.findUnique({
      where: { orderId },
    }) as unknown as Payment | null;
  }

  async findByRazorpayOrderId(razorpayOrderId: string): Promise<Payment | null> {
    return (prisma as any).payment.findFirst({
      where: { razorpayOrderId },
    }) as unknown as Payment | null;
  }

  async findByRazorpayPaymentId(razorpayPaymentId: string): Promise<Payment | null> {
    return (prisma as any).payment.findFirst({
      where: { razorpayPaymentId },
    }) as unknown as Payment | null;
  }

  async create(data: CreatePaymentData): Promise<Payment> {
    return (prisma as any).payment.create({
      data: {
        orderId: data.orderId,
        gateway: data.gateway,
        amount: data.amount,
        currency: data.currency || 'INR',
        status: 'PENDING',
        metadata: data.metadata || {},
      },
    }) as unknown as Payment;
  }

  async update(id: string, data: Partial<Payment>): Promise<Payment> {
    return (prisma as any).payment.update({
      where: { id },
      data,
    }) as unknown as Payment;
  }

  async updateByOrderId(orderId: string, data: Partial<Payment>): Promise<Payment> {
    return (prisma as any).payment.update({
      where: { orderId },
      data,
    }) as unknown as Payment;
  }

  async updateStatus(id: string, status: Payment['status']): Promise<Payment> {
    return (prisma as any).payment.update({
      where: { id },
      data: { status },
    }) as unknown as Payment;
  }
}

