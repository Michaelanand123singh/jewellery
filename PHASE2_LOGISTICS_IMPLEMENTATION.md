# Phase 2: Logistics System (Shiprocket) - Implementation Summary

## ✅ Completed

### 1. Database Schema
- ✅ Added `Shipment` model to Prisma schema
- ✅ Added `ShipmentStatus` enum
- ✅ Added relation from `Order` to `Shipment`
- ✅ Shipment model includes:
  - Shiprocket order ID, shipment ID, AWB number
  - Courier details (name, ID, tracking URL)
  - Shipment status and tracking
  - Weight and dimensions
  - Shipping charges
  - Status history
  - RTO (Return to Origin) tracking

### 2. Domain Layer
- ✅ Created `src/domains/logistics/` structure:
  - `types/logistics.types.ts` - Logistics types and Shiprocket API interfaces
  - `repositories/logistics.repository.ts` - Data access layer
  - `services/shiprocket.service.ts` - Shiprocket API integration
  - `services/logistics.service.ts` - Business logic
  - `validators/logistics.validator.ts` - Input validation

### 3. Shiprocket Service Features
- ✅ Authentication with token caching
- ✅ Pincode serviceability check
- ✅ Order creation in Shiprocket
- ✅ Shipment creation
- ✅ Tracking retrieval
- ✅ Shipment cancellation
- ✅ Label generation

### 4. Logistics Service Features
- ✅ Create shipment for order
- ✅ Automatic order status updates
- ✅ Webhook processing
- ✅ Status mapping (Shiprocket → Internal)
- ✅ Tracking integration

### 5. API Endpoints
- ✅ `GET /api/v1/logistics/pincode-check` - Check serviceability
- ✅ `POST /api/v1/logistics/create-shipment` - Create shipment (Admin)
- ✅ `GET /api/v1/logistics/tracking` - Get tracking info
- ✅ `POST /api/webhooks/shiprocket` - Shiprocket webhook handler

### 6. Integration
- ✅ Auto-updates order status on shipment creation
- ✅ Auto-updates order status on webhook events
- ✅ Maps Shiprocket status codes to internal statuses

### 7. Dependencies
- ✅ Updated `lib/env.ts` with Shiprocket config validation
- ✅ Updated `env.example` with Shiprocket variables
- ✅ Added pickup address configuration

## 🔄 Next Steps

### Database Migration Required
Run the following to create the Shipment table:

```bash
npm run db:push
# OR
npm run db:migrate
```

### Environment Variables
Add to your `.env` file:

```env
# Shiprocket API Credentials
SHIPROCKET_EMAIL="your-shiprocket-email"
SHIPROCKET_PASSWORD="your-shiprocket-password"
SHIPROCKET_BASE_URL="https://apiv2.shiprocket.in/v1/external"

# Pickup Address (Required for creating shipments)
SHIPROCKET_PICKUP_NAME="Nextin Jewellery"
SHIPROCKET_PICKUP_PHONE="+91XXXXXXXXXX"
SHIPROCKET_PICKUP_EMAIL="pickup@nextinjewellery.com"
SHIPROCKET_PICKUP_ADDRESS="Your Warehouse Address"
SHIPROCKET_PICKUP_ADDRESS_LINE2="Floor, Building"
SHIPROCKET_PICKUP_CITY="Mumbai"
SHIPROCKET_PICKUP_STATE="Maharashtra"
SHIPROCKET_PICKUP_COUNTRY="India"
SHIPROCKET_PICKUP_PINCODE="400001"
```

### Shiprocket Dashboard Setup
1. Create Shiprocket account at https://shiprocket.in
2. Get API credentials from Dashboard → Settings → API
3. Set up webhook URL: `https://yourdomain.com/api/webhooks/shiprocket`
4. Configure pickup address in Shiprocket dashboard
5. Enable webhook events for shipment status updates

## 📝 Integration Guide

### 1. Check Pincode Serviceability

```typescript
const response = await fetch(
  `/api/v1/logistics/pincode-check?pickupPincode=400001&deliveryPincode=110001&weight=500`
);
const { data } = await response.json();
// Returns available courier companies and rates
```

### 2. Create Shipment (Admin)

After order is confirmed and payment is successful:

```typescript
const response = await fetch('/api/v1/logistics/create-shipment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`,
  },
  body: JSON.stringify({
    orderId: 'order_123',
    courierId: 1, // Optional: specific courier
  }),
});

const { data } = await response.json();
// Returns shipment with AWB number and tracking URL
```

### 3. Get Tracking Information

```typescript
// By order ID
const response = await fetch(
  `/api/v1/logistics/tracking?orderId=order_123`
);

// By AWB number
const response = await fetch(
  `/api/v1/logistics/tracking?awbNumber=1234567890`
);

const { data } = await response.json();
// Returns shipment details and tracking information
```

### 4. Webhook Processing

Shiprocket will automatically send webhooks for:
- Shipment status updates
- Delivery confirmation
- RTO (Return to Origin)
- Failed delivery

The webhook handler automatically:
- Updates shipment status
- Updates order status
- Stores status history

## 🔍 Status Mapping

| Shiprocket Status Code | Internal Status | Order Status |
|------------------------|----------------|--------------|
| 1 - Pending | PENDING | PROCESSING |
| 2 - Processing | PROCESSING | PROCESSING |
| 3 - Shipped | IN_TRANSIT | SHIPPED |
| 4 - Delivered | DELIVERED | DELIVERED |
| 5 - RTO | RTO | - |
| 6 - Cancelled | CANCELLED | CANCELLED |
| 7 - Out for Delivery | OUT_FOR_DELIVERY | SHIPPED |

## 🔄 Order Flow Integration

1. **Order Created** → Status: PENDING
2. **Payment Successful** → Status: CONFIRMED
3. **Admin Creates Shipment** → Status: PROCESSING, Shipment: PROCESSING
4. **Shiprocket Picks Up** → Shipment: IN_TRANSIT, Order: SHIPPED
5. **Out for Delivery** → Shipment: OUT_FOR_DELIVERY
6. **Delivered** → Shipment: DELIVERED, Order: DELIVERED

## ⚠️ Important Notes

1. **Pickup Address Required** - Must configure before creating shipments
2. **Order Must Have Address** - Delivery address from order is used
3. **Payment Must Be Confirmed** - Only create shipment after payment success
4. **Webhook is Source of Truth** - Status updates come from webhooks
5. **AWB Number Required** - Tracking requires AWB number from shipment

## 🐛 Known Issues

- TypeScript errors in logistics.repository.ts (using `as any` workaround)
- These will resolve after running `npm run db:push` and regenerating Prisma Client

## 📊 Status

**Phase 2 Status: ✅ COMPLETE**

All critical logistics functionality implemented. Ready for:
- Database migration
- Environment configuration
- Shiprocket account setup
- Testing

## 🔗 Integration with Payment System

After payment is successful (Phase 1), automatically trigger shipment creation:

```typescript
// In payment webhook handler or after payment verification
if (payment.status === 'PAID' && order.status === 'CONFIRMED') {
  // Auto-create shipment (or admin can create manually)
  await logisticsService.createShipment(orderId);
}
```

