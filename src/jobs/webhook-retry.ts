/**
 * Webhook Retry Job
 * PHASE 10: Retries failed webhooks with exponential backoff
 * 
 * This job runs periodically to:
 * - Find failed webhooks that haven't exceeded max retries
 * - Retry processing them
 * - Mark as processed or increment retry count
 */

import { FailedWebhookRepository } from '@/src/domains/payments/repositories/failed-webhook.repository';
import { PaymentService } from '@/src/domains/payments/services/payment.service';
import { RazorpayWebhookPayload } from '@/src/domains/payments/types/payment.types';

export class WebhookRetryJob {
  private failedWebhookRepository: FailedWebhookRepository;
  private paymentService: PaymentService;

  constructor() {
    this.failedWebhookRepository = new FailedWebhookRepository();
    this.paymentService = new PaymentService();
  }

  /**
   * Retry failed webhooks
   */
  async retryFailedWebhooks(): Promise<{
    processed: number;
    retried: number;
    failed: number;
  }> {
    const stats = {
      processed: 0,
      retried: 0,
      failed: 0,
    };

    try {
      // Find webhooks that can be retried
      const failedWebhooks = await this.failedWebhookRepository.findRetryable(50);

      console.log(`Found ${failedWebhooks.length} failed webhooks to retry`);

      for (const failedWebhook of failedWebhooks) {
        stats.processed++;

        try {
          // Calculate exponential backoff delay
          const delay = Math.min(1000 * Math.pow(2, failedWebhook.retries), 300000); // Max 5 minutes
          const timeSinceLastRetry = failedWebhook.lastRetryAt
            ? Date.now() - failedWebhook.lastRetryAt.getTime()
            : Infinity;

          // Skip if not enough time has passed
          if (timeSinceLastRetry < delay) {
            continue;
          }

          // Verify signature again
          const isValid = this.paymentService.verifyWebhookSignature(
            JSON.stringify(failedWebhook.payload),
            failedWebhook.signature
          );

          if (!isValid) {
            // Invalid signature - increment retry and continue
            await this.failedWebhookRepository.incrementRetry(
              failedWebhook.id,
              'Invalid signature'
            );
            stats.failed++;
            continue;
          }

          // Parse payload
          const payload = failedWebhook.payload as RazorpayWebhookPayload;

          // Try to process webhook
          await this.paymentService.processWebhook(payload);

          // Success - mark as processed
          await this.failedWebhookRepository.markProcessed(failedWebhook.id);
          stats.retried++;
          console.log(`Successfully retried webhook ${failedWebhook.id}`);

        } catch (error: any) {
          stats.failed++;

          // Increment retry count
          const updated = await this.failedWebhookRepository.incrementRetry(
            failedWebhook.id,
            error.message
          );

          // If max retries exceeded, mark as processed (give up)
          if (updated.retries >= updated.maxRetries) {
            await this.failedWebhookRepository.markProcessed(failedWebhook.id);
            console.error(`Webhook ${failedWebhook.id} exceeded max retries. Giving up.`);
          } else {
            console.error(`Error retrying webhook ${failedWebhook.id}:`, error.message);
          }
        }
      }

      console.log(`Webhook retry complete. Processed: ${stats.processed}, Retried: ${stats.retried}, Failed: ${stats.failed}`);
      return stats;
    } catch (error: any) {
      console.error('Webhook retry job failed:', error);
      throw error;
    }
  }
}

/**
 * Run webhook retry job
 */
export async function runWebhookRetry() {
  const job = new WebhookRetryJob();
  return await job.retryFailedWebhooks();
}

