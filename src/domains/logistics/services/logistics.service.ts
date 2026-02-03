/**
 * Logistics service - Business logic for shipments
 */

import { LogisticsRepository } from '../repositories/logistics.repository';
import { ShiprocketService } from './shiprocket.service';
import { OrderRepository } from '@/src/domains/orders/repositories/order.repository';
import { AddressRepository } from '@/src/domains/addresses/repositories/address.repository';
import {
  Shipment,
  CreateShipmentData,
  ShipmentStatus,
  PickupAddress,
  DeliveryAddress,
  ShiprocketWebhookPayload,
} from '../types/logistics.types';
import { NotFoundError, ValidationError } from '@/src/shared/utils/errors';
import { OrderStatus } from '@/src/shared/constants/order-status';

// Lazy load env for pickup address
function getPickupAddress(): PickupAddress {
  try {
    const { env } = require('@/lib/env');
    return {
      name: env.SHIPROCKET_PICKUP_NAME || process.env.SHIPROCKET_PICKUP_NAME || 'Nextin Jewellery',
      phone: env.SHIPROCKET_PICKUP_PHONE || process.env.SHIPROCKET_PICKUP_PHONE || '',
      email: env.SHIPROCKET_PICKUP_EMAIL || process.env.SHIPROCKET_PICKUP_EMAIL || '',
      address: env.SHIPROCKET_PICKUP_ADDRESS || process.env.SHIPROCKET_PICKUP_ADDRESS || '',
      addressLine2: env.SHIPROCKET_PICKUP_ADDRESS_LINE2 || process.env.SHIPROCKET_PICKUP_ADDRESS_LINE2,
      city: env.SHIPROCKET_PICKUP_CITY || process.env.SHIPROCKET_PICKUP_CITY || '',
      state: env.SHIPROCKET_PICKUP_STATE || process.env.SHIPROCKET_PICKUP_STATE || '',
      country: env.SHIPROCKET_PICKUP_COUNTRY || process.env.SHIPROCKET_PICKUP_COUNTRY || 'India',
      pinCode: env.SHIPROCKET_PICKUP_PINCODE || process.env.SHIPROCKET_PICKUP_PINCODE || '',
    };
  } catch {
    return {
      name: process.env.SHIPROCKET_PICKUP_NAME || 'Nextin Jewellery',
      phone: process.env.SHIPROCKET_PICKUP_PHONE || '',
      email: process.env.SHIPROCKET_PICKUP_EMAIL || '',
      address: process.env.SHIPROCKET_PICKUP_ADDRESS || '',
      addressLine2: process.env.SHIPROCKET_PICKUP_ADDRESS_LINE2,
      city: process.env.SHIPROCKET_PICKUP_CITY || '',
      state: process.env.SHIPROCKET_PICKUP_STATE || '',
      country: process.env.SHIPROCKET_PICKUP_COUNTRY || 'India',
      pinCode: process.env.SHIPROCKET_PICKUP_PINCODE || '',
    };
  }
}

export class LogisticsService {
  private logisticsRepository: LogisticsRepository;
  private shiprocketService: ShiprocketService;
  private orderRepository: OrderRepository;
  private addressRepository: AddressRepository;

  constructor() {
    this.logisticsRepository = new LogisticsRepository();
    this.shiprocketService = new ShiprocketService();
    this.orderRepository = new OrderRepository();
    this.addressRepository = new AddressRepository();
  }

  /**
   * Check pincode serviceability
   */
  async checkServiceability(
    pickupPincode: string,
    deliveryPincode: string,
    weight?: number,
    codAmount?: number
  ): Promise<any> {
    return this.shiprocketService.checkServiceability(
      pickupPincode,
      deliveryPincode,
      weight,
      codAmount
    );
  }

  /**
   * Create shipment for an order
   */
  async createShipment(orderId: string, courierId?: number): Promise<Shipment> {
    // Get order with items and address
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order');
    }

    // Get user email for order
    const { prisma } = require('@/src/infrastructure/database/prisma');
    const user = await (prisma as any).user.findUnique({
      where: { id: order.userId },
      select: { email: true, name: true },
    });

    // Check if shipment already exists
    const existingShipment = await this.logisticsRepository.findByOrderId(orderId);
    if (existingShipment && existingShipment.shiprocketOrderId) {
      // Shipment already created, return it
      return existingShipment;
    }

    // Get delivery address
    const deliveryAddress = await this.addressRepository.findById(order.addressId);
    if (!deliveryAddress) {
      throw new NotFoundError('Delivery address');
    }

    // Get pickup address from config
    const pickupAddress = getPickupAddress();
    if (!pickupAddress.pinCode || !pickupAddress.phone || !pickupAddress.email) {
      throw new ValidationError('Pickup address not configured. Please set SHIPROCKET_PICKUP_* environment variables');
    }

    // Get order items
    const orderItems = order.orderItems.map(item => ({
      name: (item as any).product?.name || 'Product',
      sku: item.productId,
      units: item.quantity,
      selling_price: item.price,
      sellingPrice: item.price, // For ShipmentOrderItem type compatibility
    }));

    // Prepare Shiprocket order data
    const shiprocketOrderData = {
      order_id: orderId,
      order_date: order.createdAt.toISOString().split('T')[0],
      pickup_location: 'Primary', // Default pickup location
      billing_customer_name: deliveryAddress.fullName.split(' ')[0] || deliveryAddress.fullName,
      billing_last_name: deliveryAddress.fullName.split(' ').slice(1).join(' ') || '',
      billing_address: deliveryAddress.addressLine1,
      billing_address_2: deliveryAddress.addressLine2 || '',
      billing_city: deliveryAddress.city,
      billing_pincode: deliveryAddress.postalCode,
      billing_state: deliveryAddress.state,
      billing_country: deliveryAddress.country,
      billing_email: user?.email || '',
      billing_phone: deliveryAddress.phone,
      shipping_is_billing: true,
      shipping_customer_name: deliveryAddress.fullName.split(' ')[0] || deliveryAddress.fullName,
      shipping_last_name: deliveryAddress.fullName.split(' ').slice(1).join(' ') || '',
      shipping_address: deliveryAddress.addressLine1,
      shipping_address_2: deliveryAddress.addressLine2 || '',
      shipping_city: deliveryAddress.city,
      shipping_pincode: deliveryAddress.postalCode,
      shipping_state: deliveryAddress.state,
      shipping_country: deliveryAddress.country,
      shipping_email: user?.email || '',
      shipping_phone: deliveryAddress.phone,
      order_items: orderItems,
      payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
      sub_total: order.subtotal,
      length: 10, // Default dimensions in cm
      breadth: 10,
      height: 5,
      weight: 500, // Default weight in grams
    };

    // Create order in Shiprocket
    const shiprocketOrder = await this.shiprocketService.createOrder(shiprocketOrderData);

    // Create shipment in Shiprocket
    const shiprocketShipment = await this.shiprocketService.createShipment(
      shiprocketOrder.order_id,
      courierId
    );

    // Create or update shipment record
    const shipmentData: CreateShipmentData = {
      orderId,
      pickupAddress,
      deliveryAddress: {
        name: deliveryAddress.fullName,
        phone: deliveryAddress.phone,
        email: user?.email || '',
        address: deliveryAddress.addressLine1,
        addressLine2: deliveryAddress.addressLine2 || undefined,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        country: deliveryAddress.country,
        pinCode: deliveryAddress.postalCode,
      },
      orderItems,
    };

    let shipment: Shipment;
    if (existingShipment) {
      shipment = await this.logisticsRepository.update(existingShipment.id, {
        shiprocketOrderId: shiprocketOrder.order_id.toString(),
        shiprocketShipmentId: shiprocketShipment.shipment_id?.toString(),
        awbNumber: shiprocketShipment.awb_code,
        courierName: shiprocketShipment.courier_name,
        courierId: shiprocketShipment.courier_company_id?.toString(),
        status: ShipmentStatus.PROCESSING,
        trackingUrl: shiprocketShipment.tracking_data?.track_url,
        currentStatus: shiprocketShipment.status,
        metadata: shiprocketShipment,
      });
    } else {
      shipment = await this.logisticsRepository.create({
        ...shipmentData,
        shiprocketOrderId: shiprocketOrder.order_id.toString(),
        shiprocketShipmentId: shiprocketShipment.shipment_id?.toString(),
        awbNumber: shiprocketShipment.awb_code,
        courierName: shiprocketShipment.courier_name,
        courierId: shiprocketShipment.courier_company_id?.toString(),
        status: ShipmentStatus.PROCESSING,
        trackingUrl: shiprocketShipment.tracking_data?.track_url,
        currentStatus: shiprocketShipment.status,
        metadata: shiprocketShipment,
      } as any);
    }

    // Update order status to PROCESSING
    await this.orderRepository.update(orderId, {
      status: OrderStatus.PROCESSING as any,
    });

    return shipment;
  }

  /**
   * Process Shiprocket webhook
   */
  async processWebhook(payload: ShiprocketWebhookPayload): Promise<void> {
    // Find shipment by AWB code
    const shipment = await this.logisticsRepository.findByAwbNumber(payload.awb_code);
    if (!shipment) {
      throw new NotFoundError('Shipment');
    }

    // Map Shiprocket status to our status
    let newStatus: ShipmentStatus = shipment.status;
    let orderStatus = 'PROCESSING';

    switch (payload.status_code) {
      case '1': // Pending
        newStatus = ShipmentStatus.PENDING;
        break;
      case '2': // Processing
        newStatus = ShipmentStatus.PROCESSING;
        break;
      case '3': // Shipped
        newStatus = ShipmentStatus.IN_TRANSIT;
        orderStatus = 'SHIPPED';
        break;
      case '4': // Delivered
        newStatus = ShipmentStatus.DELIVERED;
        orderStatus = 'DELIVERED';
        break;
      case '5': // RTO
        newStatus = ShipmentStatus.RTO;
        break;
      case '6': // Cancelled
        newStatus = ShipmentStatus.CANCELLED;
        break;
      case '7': // Out for Delivery
        newStatus = ShipmentStatus.OUT_FOR_DELIVERY;
        orderStatus = 'SHIPPED';
        break;
    }

    // Update shipment
    const statusHistory = Array.isArray(shipment.statusHistory) 
      ? [...shipment.statusHistory, payload]
      : [payload];

    await this.logisticsRepository.update(shipment.id, {
      status: newStatus,
      currentStatus: payload.status,
      statusHistory,
      rtoStatus: payload.rto_status || null,
      rtoAwbNumber: payload.rto_awb || null,
      metadata: { ...shipment.metadata, latestWebhook: payload },
    });

    // Update order status
    await this.orderRepository.update(shipment.orderId, {
      status: orderStatus as any,
    });
  }

  /**
   * Get shipment tracking
   */
  async getTracking(awbNumber: string): Promise<any> {
    const shipment = await this.logisticsRepository.findByAwbNumber(awbNumber);
    if (!shipment) {
      throw new NotFoundError('Shipment');
    }

    if (!awbNumber) {
      throw new ValidationError('AWB number not available');
    }

    return this.shiprocketService.getTracking(awbNumber);
  }

  /**
   * Get shipment by order ID
   */
  async getShipmentByOrderId(orderId: string): Promise<Shipment | null> {
    return this.logisticsRepository.findByOrderId(orderId);
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(orderId: string): Promise<void> {
    const shipment = await this.logisticsRepository.findByOrderId(orderId);
    if (!shipment) {
      throw new NotFoundError('Shipment');
    }

    if (!shipment.awbNumber) {
      throw new ValidationError('AWB number not available');
    }

    await this.shiprocketService.cancelShipment(shipment.awbNumber);
    
    await this.logisticsRepository.updateStatus(shipment.id, ShipmentStatus.CANCELLED);
    
    await this.orderRepository.update(orderId, {
      status: OrderStatus.CANCELLED as any,
    });
  }
}

