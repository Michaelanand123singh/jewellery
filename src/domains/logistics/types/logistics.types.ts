/**
 * Logistics domain types
 */

export enum ShipmentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  READY_TO_SHIP = 'READY_TO_SHIP',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RTO = 'RTO',
  CANCELLED = 'CANCELLED',
}

export interface Shipment {
  id: string;
  orderId: string;
  shiprocketOrderId?: string | null;
  shiprocketShipmentId?: string | null;
  awbNumber?: string | null;
  courierName?: string | null;
  courierId?: string | null;
  courierTrackingUrl?: string | null;
  status: ShipmentStatus;
  trackingUrl?: string | null;
  labelUrl?: string | null;
  manifestUrl?: string | null;
  pickupAddress?: any;
  deliveryAddress?: any;
  weight?: number | null;
  length?: number | null;
  breadth?: number | null;
  height?: number | null;
  shippingCharges?: number | null;
  codCharges?: number | null;
  totalCharges?: number | null;
  currentStatus?: string | null;
  statusHistory?: any;
  rtoStatus?: string | null;
  rtoAwbNumber?: string | null;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShipmentData {
  orderId: string;
  pickupAddress: PickupAddress;
  deliveryAddress: DeliveryAddress;
  orderItems: ShipmentOrderItem[];
  weight?: number;
  length?: number;
  breadth?: number;
  height?: number;
  codAmount?: number;
}

export interface PickupAddress {
  name: string;
  phone: string;
  email: string;
  address: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
}

export interface DeliveryAddress {
  name: string;
  phone: string;
  email: string;
  address: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
}

export interface ShipmentOrderItem {
  name: string;
  sku: string;
  units: number;
  sellingPrice: number;
}

// Shiprocket API Response Types
export interface ShiprocketAuthResponse {
  token: string;
  token_type: string;
  expires_in: number;
}

export interface ShiprocketServiceabilityResponse {
  status: number;
  data: {
    available_courier_companies: Array<{
      courier_company_id: number;
      courier_name: string;
      rate: number;
      estimated_delivery_days: string;
    }>;
  };
}

export interface ShiprocketOrderResponse {
  status: number;
  order_id: number;
  shipment_id: number;
  status_code: number;
  onway_status: string;
  awb_code: string;
  courier_company_id: number;
  courier_name: string;
}

export interface ShiprocketShipmentResponse {
  status: number;
  data: {
    shipment_id: number;
    status: string;
    status_code: string;
    onway_status: string;
    awb_code: string;
    courier_name: string;
    courier_id: number;
    tracking_data: {
      track_url: string;
      awb_code: string;
    };
  };
}

export interface ShiprocketTrackingResponse {
  status: number;
  data: {
    tracking_data: {
      shipment_status: string;
      shipment_track: Array<{
        id: number;
        awb_code: string;
        courier_id: number;
        shipment_id: number;
        order_id: string;
        order_date: string;
        status: string;
        status_code: string;
        status_location: string;
        status_time: string;
        status_type: string;
        courier_name: string;
        first_attempt_count: number;
        delivered_date: string;
        delivered_to: string;
        destination: string;
        origin: string;
        rto_initiated_date: string;
        rto_delivered_date: string;
        rto_awb: string;
        rto_reason: string;
        rto_status: string;
        rto_status_code: string;
        rto_status_location: string;
        rto_status_time: string;
        rto_status_type: string;
        rto_courier_name: string;
        rto_first_attempt_count: number;
        rto_delivered_to: string;
        rto_destination: string;
        rto_origin: string;
        tracking_data: Array<{
          id: number;
          awb_code: string;
          courier_id: number;
          shipment_id: number;
          order_id: string;
          order_date: string;
          status: string;
          status_code: string;
          status_location: string;
          status_time: string;
          status_type: string;
          courier_name: string;
          first_attempt_count: number;
          delivered_date: string;
          delivered_to: string;
          destination: string;
          origin: string;
        }>;
      }>;
    };
  };
}

export interface ShiprocketWebhookPayload {
  shipment_id: number;
  order_id: string;
  awb_code: string;
  courier_id: number;
  courier_name: string;
  status: string;
  status_code: string;
  status_location: string;
  status_time: string;
  status_type: string;
  current_status: string;
  current_timestamp: string;
  shipment_status: string;
  rto_status?: string;
  rto_awb?: string;
}

export interface PincodeServiceabilityRequest {
  pickupPincode: string;
  deliveryPincode: string;
  weight?: number;
  codAmount?: number;
}

