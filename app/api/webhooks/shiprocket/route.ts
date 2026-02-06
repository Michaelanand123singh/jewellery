/**
 * POST /api/webhooks/shiprocket
 * Shiprocket webhook handler
 */

import { NextRequest, NextResponse } from 'next/server';
import { LogisticsService } from '@/src/domains/logistics/services/logistics.service';
import { ShiprocketWebhookPayload } from '@/src/domains/logistics/types/logistics.types';

export async function POST(request: NextRequest) {
  try {
    const payload: ShiprocketWebhookPayload = await request.json();

    // Validate payload
    if (!payload.awb_code || !payload.shipment_id) {
      return NextResponse.json(
        { success: false, error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    // Process webhook
    const logisticsService = new LogisticsService();
    await logisticsService.processWebhook(payload);

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error: any) {
    console.error('Shiprocket webhook error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Shiprocket requires GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Shiprocket webhook endpoint is active',
  });
}

