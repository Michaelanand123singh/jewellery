/**
 * Logistics repository - Data access layer for shipments
 */

import { prisma } from '@/src/infrastructure/database/prisma';
import { Shipment, CreateShipmentData } from '../types/logistics.types';

export class LogisticsRepository {
  async findById(id: string): Promise<Shipment | null> {
    return (prisma as any).shipment.findUnique({
      where: { id },
    }) as unknown as Shipment | null;
  }

  async findByOrderId(orderId: string): Promise<Shipment | null> {
    return (prisma as any).shipment.findUnique({
      where: { orderId },
    }) as unknown as Shipment | null;
  }

  async findByShiprocketOrderId(shiprocketOrderId: string): Promise<Shipment | null> {
    return (prisma as any).shipment.findFirst({
      where: { shiprocketOrderId },
    }) as unknown as Shipment | null;
  }

  async findByAwbNumber(awbNumber: string): Promise<Shipment | null> {
    return (prisma as any).shipment.findFirst({
      where: { awbNumber },
    }) as unknown as Shipment | null;
  }

  async create(data: CreateShipmentData & { 
    shiprocketOrderId?: string;
    shiprocketShipmentId?: string;
    awbNumber?: string;
    status?: string;
    metadata?: any;
  }): Promise<Shipment> {
    return (prisma as any).shipment.create({
      data: {
        orderId: data.orderId,
        shiprocketOrderId: data.shiprocketOrderId,
        shiprocketShipmentId: data.shiprocketShipmentId,
        awbNumber: data.awbNumber,
        status: data.status || 'PENDING',
        pickupAddress: data.pickupAddress,
        deliveryAddress: data.deliveryAddress,
        weight: data.weight,
        length: data.length,
        breadth: data.breadth,
        height: data.height,
        metadata: data.metadata || {},
      },
    }) as unknown as Shipment;
  }

  async update(id: string, data: Partial<Shipment>): Promise<Shipment> {
    return (prisma as any).shipment.update({
      where: { id },
      data,
    }) as unknown as Shipment;
  }

  async updateByOrderId(orderId: string, data: Partial<Shipment>): Promise<Shipment> {
    return (prisma as any).shipment.update({
      where: { orderId },
      data,
    }) as unknown as Shipment;
  }

  async updateStatus(id: string, status: Shipment['status']): Promise<Shipment> {
    return (prisma as any).shipment.update({
      where: { id },
      data: { status },
    }) as unknown as Shipment;
  }
}

