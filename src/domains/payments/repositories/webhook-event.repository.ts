/**
 * Webhook Event repository - Data access layer for webhook events
 */

import { prisma } from '@/src/infrastructure/database/prisma';

export interface WebhookEvent {
  id: string;
  razorpayEventId: string;
  eventType: string;
  paymentId?: string | null;
  orderId?: string | null;
  processed: boolean;
  processedAt?: Date | null;
  error?: string | null;
  payload?: any;
  createdAt: Date;
}

export interface CreateWebhookEventData {
  razorpayEventId: string;
  eventType: string;
  paymentId?: string | null;
  orderId?: string | null;
  payload?: any;
}

export class WebhookEventRepository {
  async findByRazorpayEventId(eventId: string): Promise<WebhookEvent | null> {
    return (prisma as any).webhookEvent.findUnique({
      where: { razorpayEventId: eventId },
    }) as unknown as WebhookEvent | null;
  }

  async create(data: CreateWebhookEventData): Promise<WebhookEvent> {
    return (prisma as any).webhookEvent.create({
      data: {
        razorpayEventId: data.razorpayEventId,
        eventType: data.eventType,
        paymentId: data.paymentId,
        orderId: data.orderId,
        payload: data.payload,
        processed: false,
      },
    }) as unknown as WebhookEvent;
  }

  async markProcessed(id: string, error?: string): Promise<WebhookEvent> {
    return (prisma as any).webhookEvent.update({
      where: { id },
      data: {
        processed: true,
        processedAt: new Date(),
        error: error || null,
      },
    }) as unknown as WebhookEvent;
  }

  async findUnprocessed(limit: number = 100): Promise<WebhookEvent[]> {
    return (prisma as any).webhookEvent.findMany({
      where: { processed: false },
      orderBy: { createdAt: 'asc' },
      take: limit,
    }) as unknown as WebhookEvent[];
  }
}

