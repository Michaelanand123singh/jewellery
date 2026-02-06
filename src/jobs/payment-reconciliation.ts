/**
 * Payment Reconciliation Job
 * PHASE 5: Reconciles pending payments with Razorpay API
 * 
 * This job runs periodically to:
 * - Find payments stuck in PENDING status
 * - Check actual status with Razorpay API
 * - Update payment and order status accordingly
 */

import Razorpay from 'razorpay';
import { PaymentRepository } from '@/src/domains/payments/repositories/payment.repository';
import { OrderRepository } from '@/src/domains/orders/repositories/order.repository';
import { PaymentAuditLogRepository } from '@/src/domains/payments/repositories/payment-audit-log.repository';
import { prisma } from '@/src/infrastructure/database/prisma';

// Lazy load env
function getRazorpayConfig() {
  try {
    const { env } = require('@/lib/env');
    return {
      keyId: env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      keySecret: env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET,
    };
  } catch {
    return {
      keyId: process.env.RAZORPAY_KEY_ID,
      keySecret: process.env.RAZORPAY_KEY_SECRET,
    };
  }
}

export class PaymentReconciliationJob {
  private paymentRepository: PaymentRepository;
  private orderRepository: OrderRepository;
  private auditLogRepository: PaymentAuditLogRepository;
  private razorpay: Razorpay | null = null;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.orderRepository = new OrderRepository();
    this.auditLogRepository = new PaymentAuditLogRepository();

    const config = getRazorpayConfig();
    if (config.keyId && config.keySecret) {
      this.razorpay = new Razorpay({
        key_id: config.keyId,
        key_secret: config.keySecret,
      });
    }
  }

  /**
   * Run reconciliation for pending payments
   */
  async reconcilePendingPayments(): Promise<{
    processed: number;
    updated: number;
    errors: number;
  }> {
    if (!this.razorpay) {
      console.error('Razorpay not configured. Skipping reconciliation.');
      return { processed: 0, updated: 0, errors: 0 };
    }

    const stats = {
      processed: 0,
      updated: 0,
      errors: 0,
    };

    try {
      // Find pending payments from last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const pendingPayments = await (prisma as any).payment.findMany({
        where: {
          status: 'PENDING',
          gateway: 'razorpay',
          razorpayOrderId: { not: null },
          createdAt: { gte: twentyFourHoursAgo },
        },
        take: 100, // Process max 100 at a time
      });

      console.log(`Found ${pendingPayments.length} pending payments to reconcile`);

      for (const payment of pendingPayments) {
        stats.processed++;

        try {
          if (!payment.razorpayOrderId) {
            continue;
          }

          // Fetch order from Razorpay
          const razorpayOrder = await this.razorpay.orders.fetch(payment.razorpayOrderId);

          if (razorpayOrder.status === 'paid') {
            // Payment was successful - fetch payment details
            const payments = await this.razorpay.orders.fetchPayments(payment.razorpayOrderId);
            
            if (payments.items && payments.items.length > 0) {
              const paymentData = payments.items[0] as any;
              
              if (paymentData.status === 'captured' || paymentData.status === 'authorized') {
                // Update payment status
                await this.updatePaymentToPaid(payment.id, paymentData);
                stats.updated++;
                console.log(`Updated payment ${payment.id} to PAID`);
              }
            }
          } else if (razorpayOrder.status === 'attempted' || razorpayOrder.status === 'created') {
            // Still pending - no action needed
            continue;
          } else {
            // Order failed or cancelled
            console.log(`Order ${payment.razorpayOrderId} status: ${razorpayOrder.status}`);
          }
        } catch (error: any) {
          stats.errors++;
          console.error(`Error reconciling payment ${payment.id}:`, error.message);
          
          // Log error but continue processing
          try {
            await this.auditLogRepository.create({
              paymentId: payment.id,
              action: 'reconciliation.error',
              performedBy: 'system',
              oldStatus: payment.status,
              newStatus: payment.status,
              metadata: {
                error: error.message,
                razorpayOrderId: payment.razorpayOrderId,
              },
            });
          } catch (logError) {
            console.error('Failed to log reconciliation error:', logError);
          }
        }
      }

      console.log(`Reconciliation complete. Processed: ${stats.processed}, Updated: ${stats.updated}, Errors: ${stats.errors}`);
      return stats;
    } catch (error: any) {
      console.error('Reconciliation job failed:', error);
      throw error;
    }
  }

  /**
   * Update payment to PAID status (similar to handlePaymentSuccess)
   */
  private async updatePaymentToPaid(paymentId: string, paymentData: any): Promise<void> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      return;
    }

    // Idempotency check
    if (payment.status === 'PAID') {
      return;
    }

    // Validate amount
    const paymentAmountInRupees = paymentData.amount / 100;
    if (Math.abs(paymentAmountInRupees - payment.amount) > 0.01) {
      console.error(`Amount mismatch for payment ${paymentId}. Expected: ${payment.amount}, Received: ${paymentAmountInRupees}`);
      return;
    }

    // Get order
    const order = await this.orderRepository.findById(payment.orderId);
    if (!order) {
      return;
    }

    // Use transaction
    await prisma.$transaction(async (tx) => {
      // Re-check status
      const currentPayment = await (tx as any).payment.findUnique({
        where: { id: paymentId },
        select: { status: true },
      });

      if (currentPayment.status === 'PAID') {
        return;
      }

      // Update payment
      await (tx as any).payment.update({
        where: { id: paymentId },
        data: {
          razorpayPaymentId: paymentData.id,
          status: 'PAID',
          method: paymentData.method,
          bank: paymentData.bank || null,
          wallet: paymentData.wallet || null,
          vpa: paymentData.vpa || null,
          metadata: paymentData,
        },
      });

      // Update order
      await (tx as any).order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'PAID',
          paymentId: paymentData.id,
          status: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
        },
      });

      // Audit log
      await (tx as any).paymentAuditLog.create({
        data: {
          paymentId: paymentId,
          action: 'payment.reconciled',
          performedBy: 'reconciliation_job',
          oldStatus: payment.status,
          newStatus: 'PAID',
          metadata: {
            razorpayPaymentId: paymentData.id,
            method: paymentData.method,
            source: 'reconciliation_job',
          },
        },
      });
    });
  }
}

/**
 * Run reconciliation job (can be called from cron or manually)
 */
export async function runPaymentReconciliation() {
  const job = new PaymentReconciliationJob();
  return await job.reconcilePendingPayments();
}

