/**
 * Failed Webhook repository - Data access layer for failed webhooks
 */

import { prisma } from '@/src/infrastructure/database/prisma';

export interface FailedWebhook {
  id: string;
  payload: any;
  signature: string;
  eventId?: string | null;
  error: string;
  retries: number;
  lastRetryAt?: Date | null;
  maxRetries: number;
  processed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFailedWebhookData {
  payload: any;
  signature: string;
  eventId?: string | null;
  error: string;
}

export class FailedWebhookRepository {
  async create(data: CreateFailedWebhookData): Promise<FailedWebhook> {
    return (prisma as any).failedWebhook.create({
      data: {
        payload: data.payload,
        signature: data.signature,
        eventId: data.eventId,
        error: data.error,
        retries: 0,
        maxRetries: 5,
        processed: false,
      },
    }) as unknown as FailedWebhook;
  }

  async findRetryable(limit: number = 50): Promise<FailedWebhook[]> {
    return (prisma as any).failedWebhook.findMany({
      where: {
        processed: false,
        retries: { lt: (prisma as any).prisma.failedWebhook.fields.maxRetries },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    }) as unknown as FailedWebhook[];
  }

  async incrementRetry(id: string, error?: string): Promise<FailedWebhook> {
    const webhook = await (prisma as any).failedWebhook.findUnique({
      where: { id },
    });

    if (!webhook) {
      throw new Error('Failed webhook not found');
    }

    return (prisma as any).failedWebhook.update({
      where: { id },
      data: {
        retries: webhook.retries + 1,
        lastRetryAt: new Date(),
        error: error || webhook.error,
      },
    }) as unknown as FailedWebhook;
  }

  async markProcessed(id: string): Promise<FailedWebhook> {
    return (prisma as any).failedWebhook.update({
      where: { id },
      data: {
        processed: true,
      },
    }) as unknown as FailedWebhook;
  }

  async delete(id: string): Promise<void> {
    await (prisma as any).failedWebhook.delete({
      where: { id },
    });
  }
}

