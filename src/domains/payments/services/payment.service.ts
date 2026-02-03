/**
 * Payment service - Business logic for payments
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { PaymentRepository } from '../repositories/payment.repository';
import { OrderRepository } from '@/src/domains/orders/repositories/order.repository';
import { WebhookEventRepository } from '../repositories/webhook-event.repository';
import { RefundRepository } from '../repositories/refund.repository';
import { PaymentAuditLogRepository } from '../repositories/payment-audit-log.repository';
import {
  Payment,
  CreatePaymentData,
  PaymentGateway,
  RazorpayOrderResponse,
  RazorpayPaymentResponse,
  RazorpayWebhookPayload,
  RefundData,
  RefundResponse,
} from '../types/payment.types';
import { NotFoundError, ValidationError } from '@/src/shared/utils/errors';
import { canTransitionOrder } from '@/src/shared/constants/order-status';
import { OrderStatus } from '@/src/shared/constants/order-status';
import { PaymentStatus } from '@/src/shared/constants/payment-methods';
import { prisma } from '@/src/infrastructure/database/prisma';

// Lazy load env to avoid validation errors
function getRazorpayConfig() {
  try {
    const { env } = require('@/lib/env');
    return {
      keyId: env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      keySecret: env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET,
      webhookSecret: env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET,
    };
  } catch {
    return {
      keyId: process.env.RAZORPAY_KEY_ID,
      keySecret: process.env.RAZORPAY_KEY_SECRET,
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    };
  }
}

export class PaymentService {
  private paymentRepository: PaymentRepository;
  private orderRepository: OrderRepository;
  private webhookEventRepository: WebhookEventRepository;
  private refundRepository: RefundRepository;
  private auditLogRepository: PaymentAuditLogRepository;
  private razorpay: Razorpay | null = null;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.orderRepository = new OrderRepository();
    this.webhookEventRepository = new WebhookEventRepository();
    this.refundRepository = new RefundRepository();
    this.auditLogRepository = new PaymentAuditLogRepository();
    
    // Initialize Razorpay client
    const config = getRazorpayConfig();
    if (config.keyId && config.keySecret) {
      this.razorpay = new Razorpay({
        key_id: config.keyId,
        key_secret: config.keySecret,
      });
    }
  }

  /**
   * Get payment ID by Razorpay payment ID (helper for webhook)
   */
  async getPaymentIdByRazorpayPaymentId(razorpayPaymentId: string): Promise<string | null> {
    const payment = await this.paymentRepository.findByRazorpayPaymentId(razorpayPaymentId);
    return payment?.id || null;
  }

  /**
   * Create Razorpay order
   */
  async createRazorpayOrder(orderId: string, amount: number, receipt?: string): Promise<RazorpayOrderResponse> {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: receipt || `order_${orderId}_${Date.now()}`,
      notes: {
        orderId,
      },
    };

    try {
      const razorpayOrder = await this.razorpay.orders.create(options);
      return razorpayOrder as RazorpayOrderResponse;
    } catch (error: any) {
      throw new Error(`Failed to create Razorpay order: ${error.message}`);
    }
  }

  /**
   * Create payment record and Razorpay order
   */
  async createPayment(data: CreatePaymentData): Promise<{ payment: Payment; razorpayOrder?: RazorpayOrderResponse }> {
    // Verify order exists
    const order = await this.orderRepository.findById(data.orderId);
    if (!order) {
      throw new NotFoundError('Order');
    }

    // Check if payment already exists
    const existingPayment = await this.paymentRepository.findByOrderId(data.orderId);
    if (existingPayment) {
      // If Razorpay order exists, return it
      if (existingPayment.razorpayOrderId && this.razorpay) {
        try {
          const razorpayOrder = await this.razorpay.orders.fetch(existingPayment.razorpayOrderId);
          return {
            payment: existingPayment,
            razorpayOrder: razorpayOrder as RazorpayOrderResponse,
          };
        } catch {
          // Order not found in Razorpay, create new one
        }
      }
    }

    // Create payment record
    const payment = existingPayment || await this.paymentRepository.create({
      orderId: data.orderId,
      amount: data.amount,
      currency: data.currency || 'INR',
      gateway: data.gateway,
      metadata: data.metadata,
    });

    // Create Razorpay order if gateway is Razorpay
    if (data.gateway === PaymentGateway.RAZORPAY && this.razorpay) {
      const razorpayOrder = await this.createRazorpayOrder(
        data.orderId,
        data.amount,
        `order_${data.orderId}`
      );

      // Update payment with Razorpay order ID
      await this.paymentRepository.update(payment.id, {
        razorpayOrderId: razorpayOrder.id,
      });

      return {
        payment: await this.paymentRepository.findById(payment.id) as Payment,
        razorpayOrder,
      };
    }

    return { payment };
  }

  /**
   * Verify Razorpay payment signature
   */
  verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    const config = getRazorpayConfig();
    if (!config.keySecret) {
      throw new Error('Razorpay key secret not configured');
    }

    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', config.keySecret)
      .update(text)
      .digest('hex');

    return generatedSignature === signature;
  }

  /**
   * Verify Razorpay webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const config = getRazorpayConfig();
    if (!config.webhookSecret) {
      throw new Error('Razorpay webhook secret not configured');
    }

    const generatedSignature = crypto
      .createHmac('sha256', config.webhookSecret)
      .update(payload)
      .digest('hex');

    return generatedSignature === signature;
  }

  /**
   * Process Razorpay webhook
   * PHASE 1: Idempotency handled by caller
   * PHASE 6: Added refund webhook handling
   */
  async processWebhook(payload: RazorpayWebhookPayload, webhookEventId?: string): Promise<void> {
    const { event, payload: webhookPayload } = payload;

    if (event === 'payment.captured' || event === 'payment.authorized') {
      const paymentData = webhookPayload.payment?.entity;
      if (!paymentData) {
        throw new ValidationError('Payment data missing in webhook');
      }

      await this.handlePaymentSuccess(paymentData, webhookEventId);
    } else if (event === 'payment.failed') {
      const paymentData = webhookPayload.payment?.entity;
      if (!paymentData) {
        throw new ValidationError('Payment data missing in webhook');
      }

      await this.handlePaymentFailure(paymentData, webhookEventId);
    } else if (event === 'refund.processed' || event === 'refund.failed') {
      const refundData = (webhookPayload as any).refund?.entity;
      if (!refundData) {
        throw new ValidationError('Refund data missing in webhook');
      }

      await this.handleRefundWebhook(refundData, webhookEventId);
    } else if (event === 'order.paid') {
      // Handle order.paid event (if needed)
      const orderData = webhookPayload.order?.entity;
      if (orderData) {
        await this.handleOrderPaid(orderData, webhookEventId);
      }
    }
  }

  /**
   * Handle successful payment
   * PHASE 2: Amount validation
   * PHASE 3: Payment idempotency
   * PHASE 7: Order state machine validation
   */
  private async handlePaymentSuccess(paymentData: RazorpayPaymentResponse, webhookEventId?: string): Promise<void> {
    // Find payment by Razorpay payment ID or order ID from notes
    let payment = await this.paymentRepository.findByRazorpayPaymentId(paymentData.id);
    
    if (!payment) {
      // Try to find by order ID from payment notes
      const orderId = paymentData.notes?.orderId;
      if (orderId) {
        payment = await this.paymentRepository.findByOrderId(orderId);
      }
    }

    if (!payment) {
      throw new NotFoundError('Payment');
    }

    // PHASE 3: IDEMPOTENCY CHECK - If already PAID, return early
    if (payment.status === 'PAID') {
      console.log(`Payment ${payment.id} already processed. Skipping.`);
      return; // Idempotent - already done
    }

    // PHASE 2: Validate payment amount matches order total
    const paymentAmountInRupees = paymentData.amount / 100; // Razorpay amount is in paise
    if (Math.abs(paymentAmountInRupees - payment.amount) > 0.01) {
      const error = `Payment amount mismatch. Expected: ${payment.amount}, Received: ${paymentAmountInRupees}`;
      console.error(error);
      
      // Log to audit
      await this.auditLogRepository.create({
        paymentId: payment.id,
        action: 'payment.amount_mismatch',
        performedBy: 'razorpay_webhook',
        oldStatus: payment.status,
        newStatus: payment.status,
        metadata: { 
          expected: payment.amount, 
          received: paymentAmountInRupees,
          razorpayPaymentId: paymentData.id,
        },
      });

      throw new ValidationError(error);
    }

    // Get order for state validation
    const order = await this.orderRepository.findById(payment.orderId);
    if (!order) {
      throw new NotFoundError('Order');
    }

    // PHASE 7: Validate order state transition
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
      // Allow CONFIRMED in case webhook arrives after manual confirmation
      if (!canTransitionOrder(order.status, OrderStatus.CONFIRMED)) {
        throw new ValidationError(
          `Cannot confirm order in ${order.status} status. Order may be cancelled or already delivered.`
        );
      }
    }

    // PHASE 3: Use transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Re-check payment status inside transaction (double-check locking)
      const currentPayment = await (tx as any).payment.findUnique({
        where: { id: payment.id },
        select: { status: true },
      });

      if (currentPayment.status === 'PAID') {
        return; // Already processed by another request
      }

      // Update payment record
      await (tx as any).payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId: paymentData.id,
          status: 'PAID',
          method: paymentData.method,
          bank: paymentData.bank || null,
          wallet: paymentData.wallet || null,
          vpa: paymentData.vpa || null,
          metadata: paymentData as any,
        },
      });

      // Update order payment status and status
      await (tx as any).order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: PaymentStatus.PAID as any,
          paymentId: paymentData.id,
          status: (order.status === OrderStatus.PENDING ? OrderStatus.CONFIRMED : order.status) as any,
        },
      });

      // PHASE 9: Audit log
      await (tx as any).paymentAuditLog.create({
        data: {
          paymentId: payment.id,
          action: 'payment.captured',
          performedBy: 'razorpay_webhook',
          oldStatus: payment.status,
          newStatus: 'PAID',
          metadata: {
            razorpayPaymentId: paymentData.id,
            method: paymentData.method,
            webhookEventId,
          },
        },
      });
    });
  }

  /**
   * Handle failed payment
   * PHASE 3: Idempotency check added
   */
  private async handlePaymentFailure(paymentData: RazorpayPaymentResponse, webhookEventId?: string): Promise<void> {
    let payment = await this.paymentRepository.findByRazorpayPaymentId(paymentData.id);
    
    if (!payment) {
      // Try to find by order ID from payment data
      const orderId = paymentData.notes?.orderId;
      if (orderId) {
        payment = await this.paymentRepository.findByOrderId(orderId);
      }
    }

    if (!payment) {
      throw new NotFoundError('Payment');
    }

    // PHASE 3: IDEMPOTENCY - If already FAILED, return early
    if (payment.status === 'FAILED') {
      console.log(`Payment ${payment.id} already marked as failed. Skipping.`);
      return;
    }

    // Use transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Re-check status inside transaction
      const currentPayment = await (tx as any).payment.findUnique({
        where: { id: payment.id },
        select: { status: true },
      });

      if (currentPayment.status === 'FAILED') {
        return; // Already processed
      }

      await (tx as any).payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId: paymentData.id,
          status: 'FAILED',
          failureReason: paymentData.error_description || paymentData.error_reason || 'Payment failed',
          metadata: paymentData as any,
        },
      });

      await (tx as any).order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: PaymentStatus.FAILED as any,
        },
      });

      // PHASE 9: Audit log
      await (tx as any).paymentAuditLog.create({
        data: {
          paymentId: payment.id,
          action: 'payment.failed',
          performedBy: 'razorpay_webhook',
          oldStatus: payment.status,
          newStatus: 'FAILED',
          metadata: {
            razorpayPaymentId: paymentData.id,
            error: paymentData.error_description || paymentData.error_reason,
            webhookEventId,
          },
        },
      });
    });
  }

  /**
   * Handle refund webhook (PHASE 6)
   */
  private async handleRefundWebhook(refundData: any, webhookEventId?: string): Promise<void> {
    const razorpayRefundId = refundData.id;
    const razorpayPaymentId = refundData.payment_id;

    // Find payment
    const payment = await this.paymentRepository.findByRazorpayPaymentId(razorpayPaymentId);
    if (!payment) {
      throw new NotFoundError('Payment');
    }

    // Check if refund already exists
    const existingRefund = await this.refundRepository.findByRazorpayRefundId(razorpayRefundId);
    if (existingRefund) {
      // Update refund status
      await this.refundRepository.update(existingRefund.id, {
        status: refundData.status,
      });
      return;
    }

    // Create refund record
    await this.refundRepository.create({
      paymentId: payment.id,
      razorpayRefundId,
      amount: refundData.amount / 100, // Convert from paise
      currency: refundData.currency || 'INR',
      status: refundData.status,
      reason: refundData.notes?.reason,
      notes: refundData,
    });

    // Update payment refund amount
    const totalRefunded = await this.refundRepository.getTotalRefundedAmount(payment.id);
    const isFullRefund = totalRefunded >= payment.amount;

    await prisma.$transaction(async (tx) => {
      await (tx as any).payment.update({
        where: { id: payment.id },
        data: {
          refundAmount: totalRefunded,
          refundStatus: refundData.status,
          status: isFullRefund ? 'REFUNDED' : payment.status,
        },
      });

      if (isFullRefund) {
        await (tx as any).order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: 'REFUNDED',
          },
        });
      }

      // PHASE 9: Audit log
      await (tx as any).paymentAuditLog.create({
        data: {
          paymentId: payment.id,
          action: 'refund.processed',
          performedBy: 'razorpay_webhook',
          oldStatus: payment.status,
          newStatus: isFullRefund ? 'REFUNDED' : payment.status,
          metadata: {
            razorpayRefundId,
            refundAmount: refundData.amount / 100,
            webhookEventId,
          },
        },
      });
    });
  }

  /**
   * Handle order.paid event (if needed)
   */
  private async handleOrderPaid(orderData: RazorpayOrderResponse, webhookEventId?: string): Promise<void> {
    const payment = await this.paymentRepository.findByRazorpayOrderId(orderData.id);
    if (!payment) {
      return; // Order not found, skip
    }

    // If payment already processed, skip
    if (payment.status === 'PAID') {
      return;
    }

    // Fetch payment details from Razorpay
    if (!this.razorpay) {
      return;
    }

    try {
      const payments = await this.razorpay.orders.fetchPayments(orderData.id);
      if (payments.items && payments.items.length > 0) {
        const paymentData = payments.items[0] as RazorpayPaymentResponse;
        if (paymentData.status === 'captured') {
          await this.handlePaymentSuccess(paymentData, webhookEventId);
        }
      }
    } catch (error) {
      console.error('Error fetching payments for order:', error);
    }
  }

  /**
   * Verify and capture payment manually (for COD or manual verification)
   */
  async verifyPayment(paymentId: string, razorpayPaymentId: string, signature: string): Promise<Payment> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment');
    }

    if (!payment.razorpayOrderId) {
      throw new ValidationError('Razorpay order ID not found');
    }

    // Verify signature
    if (!this.verifySignature(payment.razorpayOrderId, razorpayPaymentId, signature)) {
      throw new ValidationError('Invalid payment signature');
    }

    // Fetch payment from Razorpay
    if (!this.razorpay) {
      throw new Error('Razorpay not configured');
    }

    try {
      const razorpayPayment = await this.razorpay.payments.fetch(razorpayPaymentId);
      
      if (razorpayPayment.status === 'captured' || razorpayPayment.status === 'authorized') {
        await this.handlePaymentSuccess(razorpayPayment as RazorpayPaymentResponse);
      } else {
        throw new ValidationError(`Payment not captured. Status: ${razorpayPayment.status}`);
      }

      return await this.paymentRepository.findById(paymentId) as Payment;
    } catch (error: any) {
      throw new Error(`Failed to verify payment: ${error.message}`);
    }
  }

  /**
   * Process COD payment
   */
  async processCOD(orderId: string): Promise<Payment> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order');
    }

    // Create payment record
    const payment = await this.paymentRepository.create({
      orderId,
      amount: order.total,
      currency: 'INR',
      gateway: PaymentGateway.COD,
    });

    // PHASE 4: COD payments start as PENDING (not PAID)
    // They will be marked PAID only after delivery confirmation
    await this.paymentRepository.updateStatus(payment.id, PaymentStatus.PENDING);

    // Update order - payment is PENDING but order can be CONFIRMED
    await this.orderRepository.update(orderId, {
      paymentStatus: PaymentStatus.PENDING as any, // Not PAID - payment pending until delivery
      paymentId: payment.id,
      status: OrderStatus.CONFIRMED as any, // Order confirmed but payment pending
    });

    // PHASE 9: Audit log
    await this.auditLogRepository.create({
      paymentId: payment.id,
      action: 'payment.created',
      performedBy: 'system',
      oldStatus: null,
      newStatus: PaymentStatus.PENDING,
      metadata: { gateway: 'cod', note: 'COD payment - pending until delivery' },
    });

    return await this.paymentRepository.findById(payment.id) as Payment;
  }

  /**
   * Mark COD payment as PAID (called after delivery confirmation)
   * PHASE 4: Separate method for marking COD as paid
   */
  async markCODPaid(orderId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findByOrderId(orderId);
    if (!payment) {
      throw new NotFoundError('Payment');
    }

    if (payment.gateway !== PaymentGateway.COD) {
      throw new ValidationError('Payment is not COD');
    }

    if (payment.status === PaymentStatus.PAID) {
      return payment; // Already paid
    }

    await prisma.$transaction(async (tx) => {
      await (tx as any).payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.PAID },
      });

      await (tx as any).order.update({
        where: { id: orderId },
        data: { paymentStatus: PaymentStatus.PAID as any },
      });

      // PHASE 9: Audit log
      await (tx as any).paymentAuditLog.create({
        data: {
          paymentId: payment.id,
          action: 'payment.cod_paid',
          performedBy: 'system',
          oldStatus: payment.status,
          newStatus: PaymentStatus.PAID,
          metadata: { note: 'COD payment received on delivery' },
        },
      });
    });

    return await this.paymentRepository.findById(payment.id) as Payment;
  }

  /**
   * Process refund
   * PHASE 6: Hardened with validation and Refund model
   */
  async processRefund(data: RefundData, performedBy?: string): Promise<RefundResponse> {
    const payment = await this.paymentRepository.findById(data.paymentId);
    if (!payment) {
      throw new NotFoundError('Payment');
    }

    if (payment.gateway !== PaymentGateway.RAZORPAY || !payment.razorpayPaymentId) {
      throw new ValidationError('Refund only supported for Razorpay payments');
    }

    if (!this.razorpay) {
      throw new Error('Razorpay not configured');
    }

    if (payment.status !== 'PAID') {
      throw new ValidationError('Payment must be PAID to process refund');
    }

    const refundAmount = data.amount 
      ? Math.round(data.amount * 100) // Convert to paise
      : undefined; // Full refund if amount not specified

    try {
      const refund = await this.razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: refundAmount,
        notes: data.notes,
      }) as RefundResponse;

      // PHASE 6: Create refund record (new approach)
      await this.refundRepository.create({
        paymentId: payment.id,
        razorpayRefundId: refund.id,
        amount: refund.amount / 100, // Convert from paise
        currency: refund.currency || 'INR',
        status: refund.status,
        reason: data.notes?.reason,
        notes: refund,
      });

      // Update payment refund amount
      const totalRefunded = await this.refundRepository.getTotalRefundedAmount(payment.id);
      const isFullRefund = totalRefunded >= payment.amount;

      await prisma.$transaction(async (tx) => {
        await (tx as any).payment.update({
          where: { id: payment.id },
          data: {
            refundAmount: totalRefunded,
            refundStatus: refund.status,
            status: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PAID,
          },
        });

        // Update order payment status
        if (isFullRefund) {
          await (tx as any).order.update({
            where: { id: payment.orderId },
            data: {
              paymentStatus: PaymentStatus.REFUNDED as any,
            },
          });
        }

        // PHASE 9: Audit log
        await (tx as any).paymentAuditLog.create({
          data: {
            paymentId: payment.id,
            action: 'refund.initiated',
            performedBy: performedBy || 'system',
            oldStatus: payment.status,
            newStatus: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PAID,
            metadata: {
              razorpayRefundId: refund.id,
              refundAmount: refund.amount / 100,
              totalRefunded,
            },
          },
        });
      });

      return refund;
    } catch (error: any) {
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }

  /**
   * Get payment by order ID
   */
  async getPaymentByOrderId(orderId: string): Promise<Payment | null> {
    return this.paymentRepository.findByOrderId(orderId);
  }
}

