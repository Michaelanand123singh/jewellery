/**
 * Payment domain types
 */

export enum PaymentGateway {
  RAZORPAY = 'razorpay',
  COD = 'cod',
}

export enum PaymentMethod {
  CARD = 'card',
  NETBANKING = 'netbanking',
  WALLET = 'wallet',
  UPI = 'upi',
  COD = 'cod',
}

export interface Payment {
  id: string;
  orderId: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  method?: string | null;
  bank?: string | null;
  wallet?: string | null;
  vpa?: string | null;
  refundId?: string | null;
  refundAmount?: number | null;
  refundStatus?: string | null;
  metadata?: any;
  failureReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentData {
  orderId: string;
  amount: number;
  currency?: string;
  gateway: PaymentGateway;
  metadata?: any;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id?: string;
  status: string;
  attempts: number;
  notes?: Record<string, any>;
  created_at: number;
}

export interface RazorpayPaymentResponse {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  invoice_id?: string;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status?: string;
  captured: boolean;
  description?: string;
  card_id?: string;
  bank?: string;
  wallet?: string;
  vpa?: string;
  email: string;
  contact: string;
  notes?: Record<string, any>;
  fee?: number;
  tax?: number;
  error_code?: string;
  error_description?: string;
  error_source?: string;
  error_step?: string;
  error_reason?: string;
  acquirer_data?: Record<string, any>;
  created_at: number;
}

export interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment: {
      entity: RazorpayPaymentResponse;
    };
    order: {
      entity: RazorpayOrderResponse;
    };
  };
  created_at: number;
}

export interface RefundData {
  paymentId: string;
  amount?: number; // If not provided, full refund
  notes?: Record<string, any>;
}

export interface RefundResponse {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  payment_id: string;
  notes?: Record<string, any>;
  receipt?: string;
  acquirer_data?: Record<string, any>;
  created_at: number;
  batch_id?: string;
  status: string;
  speed_processed: string;
  speed_requested: string;
}

