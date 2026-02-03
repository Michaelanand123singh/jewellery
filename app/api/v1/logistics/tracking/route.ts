/**
 * GET /api/v1/logistics/tracking
 * Get shipment tracking information
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { LogisticsService } from '@/src/domains/logistics/services/logistics.service';
import { OrderRepository } from '@/src/domains/orders/repositories/order.repository';
import { getTrackingSchema } from '@/src/domains/logistics/validators/logistics.validator';
import { handleApiError } from '@/src/shared/middleware/error.middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const awbNumber = searchParams.get('awbNumber');
    const orderId = searchParams.get('orderId');

    // If orderId provided, verify user owns the order
    if (orderId) {
      const orderRepository = new OrderRepository();
      const order = await orderRepository.findById(orderId);
      
      if (!order) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }

      if (order.userId !== user.id && user.role !== 'ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 403 }
        );
      }

      // Get shipment by order ID
      const logisticsService = new LogisticsService();
      const shipment = await logisticsService.getShipmentByOrderId(orderId);
      
      if (!shipment || !shipment.awbNumber) {
        return NextResponse.json(
          { success: false, error: 'Shipment not found or AWB not available' },
          { status: 404 }
        );
      }

      const tracking = await logisticsService.getTracking(shipment.awbNumber);
      return NextResponse.json({
        success: true,
        data: {
          shipment,
          tracking,
        },
      });
    }

    // If AWB number provided directly
    if (awbNumber) {
      if (!awbNumber || awbNumber.length < 1) {
        return NextResponse.json(
          { success: false, error: 'AWB number is required' },
          { status: 400 }
        );
      }
      const logisticsService = new LogisticsService();
      const tracking = await logisticsService.getTracking(awbNumber);
      
      return NextResponse.json({
        success: true,
        data: tracking,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Either orderId or awbNumber is required' },
      { status: 400 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

