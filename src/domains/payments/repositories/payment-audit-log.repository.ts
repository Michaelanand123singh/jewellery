/**
 * Payment Audit Log repository - Data access layer for payment audit logs
 */

import { prisma } from '@/src/infrastructure/database/prisma';

export interface PaymentAuditLog {
  id: string;
  paymentId: string;
  action: string;
  performedBy?: string | null;
  oldStatus?: string | null;
  newStatus: string;
  metadata?: any;
  createdAt: Date;
}

export interface CreateAuditLogData {
  paymentId: string;
  action: string;
  performedBy?: string | null;
  oldStatus?: string | null;
  newStatus: string;
  metadata?: any;
}

export class PaymentAuditLogRepository {
  async create(data: CreateAuditLogData): Promise<PaymentAuditLog> {
    return (prisma as any).paymentAuditLog.create({
      data: {
        paymentId: data.paymentId,
        action: data.action,
        performedBy: data.performedBy || 'system',
        oldStatus: data.oldStatus,
        newStatus: data.newStatus,
        metadata: data.metadata,
      },
    }) as unknown as PaymentAuditLog;
  }

  async findByPaymentId(paymentId: string): Promise<PaymentAuditLog[]> {
    return (prisma as any).paymentAuditLog.findMany({
      where: { paymentId },
      orderBy: { createdAt: 'desc' },
    }) as unknown as PaymentAuditLog[];
  }

  async findByAction(action: string, limit: number = 100): Promise<PaymentAuditLog[]> {
    return (prisma as any).paymentAuditLog.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }) as unknown as PaymentAuditLog[];
  }
}

