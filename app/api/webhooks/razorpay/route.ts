/**
 * POST /api/webhooks/razorpay
 * Razorpay webhook handler with idempotency protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/src/domains/payments/services/payment.service';
import { RazorpayWebhookPayload } from '@/src/domains/payments/types/payment.types';
import { WebhookEventRepository } from '@/src/domains/payments/repositories/webhook-event.repository';
import { FailedWebhookRepository } from '@/src/domains/payments/repositories/failed-webhook.repository';

const MAX_WEBHOOK_SIZE = 64 * 1024; // 64KB

export async function POST(request: NextRequest) {
  let rawBody: string = '';
  let signature: string | null = null;
  let payload: RazorpayWebhookPayload | null = null;

  try {
    // Enforce HTTPS (in production)
    if (process.env.NODE_ENV === 'production' && request.url.startsWith('http://')) {
      return NextResponse.json(
        { success: false, error: 'HTTPS required' },
        { status: 403 }
      );
    }

    // Get raw body for signature verification
    rawBody = await request.text();

    // Check webhook size limit
    if (rawBody.length > MAX_WEBHOOK_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Webhook payload too large' },
        { status: 413 }
      );
    }

    signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const paymentService = new PaymentService();
    const isValid = paymentService.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    payload = JSON.parse(rawBody) as RazorpayWebhookPayload;

    // Extract event ID for idempotency check
    const eventId = (payload as any).id || `${payload.event}_${payload.created_at}_${payload.account_id}`;
    const webhookEventRepo = new WebhookEventRepository();

    // Check if webhook already processed (IDEMPOTENCY)
    const existingEvent = await webhookEventRepo.findByRazorpayEventId(eventId);
    if (existingEvent?.processed) {
      // Already processed - return success (idempotent)
      return NextResponse.json({
        success: true,
        message: 'Webhook already processed',
        eventId,
      });
    }

    // Create webhook event record (before processing)
    let webhookEvent;
    if (!existingEvent) {
      const paymentId = payload.payload?.payment?.entity?.id 
        ? await paymentService.getPaymentIdByRazorpayPaymentId(payload.payload.payment.entity.id)
        : null;
      const orderId = payload.payload?.payment?.entity?.notes?.orderId || null;

      webhookEvent = await webhookEventRepo.create({
        razorpayEventId: eventId,
        eventType: payload.event,
        paymentId,
        orderId,
        payload: payload,
      });
    } else {
      webhookEvent = existingEvent;
    }

    // Process webhook
    await paymentService.processWebhook(payload, webhookEvent.id);

    // Mark as processed
    await webhookEventRepo.markProcessed(webhookEvent.id);

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      eventId,
    });
  } catch (error: any) {
    console.error('Razorpay webhook error:', error);

    // Store failed webhook for retry
    try {
      const failedWebhookRepo = new FailedWebhookRepository();
      await failedWebhookRepo.create({
        payload: payload || { error: 'Failed to parse payload' },
        signature: signature || '',
        eventId: payload ? ((payload as any)?.id || null) : null,
        error: error.message || 'Webhook processing failed',
      });
    } catch (storeError) {
      console.error('Failed to store failed webhook:', storeError);
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Razorpay requires GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Razorpay webhook endpoint is active',
  });
}

