/**
 * Job Scheduler
 * PHASE 5 & 10: Schedules background jobs
 * 
 * Uses setInterval for simple scheduling
 * For production, consider using node-cron or Bull/BullMQ
 */

import { runPaymentReconciliation } from './payment-reconciliation';
import { runWebhookRetry } from './webhook-retry';

const RECONCILIATION_INTERVAL = 5 * 60 * 1000; // 5 minutes
const WEBHOOK_RETRY_INTERVAL = 10 * 60 * 1000; // 10 minutes

let reconciliationInterval: NodeJS.Timeout | null = null;
let webhookRetryInterval: NodeJS.Timeout | null = null;

/**
 * Start all scheduled jobs
 */
export function startScheduledJobs() {
  console.log('Starting scheduled jobs...');

  // Payment reconciliation job (every 5 minutes)
  reconciliationInterval = setInterval(async () => {
    try {
      console.log('Running payment reconciliation job...');
      await runPaymentReconciliation();
    } catch (error) {
      console.error('Payment reconciliation job error:', error);
    }
  }, RECONCILIATION_INTERVAL);

  // Webhook retry job (every 10 minutes)
  webhookRetryInterval = setInterval(async () => {
    try {
      console.log('Running webhook retry job...');
      await runWebhookRetry();
    } catch (error) {
      console.error('Webhook retry job error:', error);
    }
  }, WEBHOOK_RETRY_INTERVAL);

  console.log('Scheduled jobs started');
}

/**
 * Stop all scheduled jobs
 */
export function stopScheduledJobs() {
  if (reconciliationInterval) {
    clearInterval(reconciliationInterval);
    reconciliationInterval = null;
  }

  if (webhookRetryInterval) {
    clearInterval(webhookRetryInterval);
    webhookRetryInterval = null;
  }

  console.log('Scheduled jobs stopped');
}

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  startScheduledJobs();
}

