"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import Image from "next/image";
import { Package, MapPin, User, CreditCard, Edit } from "lucide-react";

interface Order {
  id: string;
  userId: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentId?: string | null;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  orderItems: Array<{
    id: string;
    quantity: number;
    price: number;
    product?: {
      id: string;
      name: string;
      image: string;
      price: number;
    };
    variant?: {
      id: string;
      name: string;
      sku: string;
    };
  }>;
  address?: {
    id: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  user?: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
}

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onStatusUpdate?: () => void;
}

export function OrderDetailsDialog({
  open,
  onOpenChange,
  order,
  onStatusUpdate,
}: OrderDetailsDialogProps) {
  if (!order) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "DELIVERED":
        return "default";
      case "CONFIRMED":
      case "PROCESSING":
        return "secondary";
      case "SHIPPED":
        return "outline";
      case "CANCELLED":
      case "RETURNED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
        return "default";
      case "PENDING":
        return "secondary";
      case "FAILED":
        return "destructive";
      case "REFUNDED":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order Details - {order.id.substring(0, 8)}...</span>
            <div className="flex gap-2">
              <Badge variant={getStatusColor(order.status) as any}>{order.status}</Badge>
              <Badge variant={getPaymentStatusColor(order.paymentStatus) as any}>
                {order.paymentStatus}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            Order placed on {format(new Date(order.createdAt), "PPpp")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-base">{order.user?.name || "Guest"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base">{order.user?.email || "N/A"}</p>
                </div>
                {order.user?.phone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="text-base">{order.user.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User ID</p>
                  <p className="text-base font-mono text-xs">{order.userId}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {order.address && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-medium">{order.address.fullName}</p>
                  <p className="text-sm text-muted-foreground">{order.address.phone}</p>
                  <p className="text-sm">
                    {order.address.addressLine1}
                    {order.address.addressLine2 && `, ${order.address.addressLine2}`}
                  </p>
                  <p className="text-sm">
                    {order.address.city}, {order.address.state} {order.address.postalCode}
                  </p>
                  <p className="text-sm">{order.address.country}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                Order Items ({order.orderItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                      {item.product?.image ? (
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{item.product?.name || "Unknown Product"}</p>
                      {item.variant && (
                        <p className="text-sm text-muted-foreground">
                          Variant: {item.variant.name} (SKU: {item.variant.sku})
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      <p className="text-sm text-muted-foreground">
                        Price: {formatCurrency(item.price)} each
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                  <p className="text-base capitalize">{order.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
                  <Badge variant={getPaymentStatusColor(order.paymentStatus) as any}>
                    {order.paymentStatus}
                  </Badge>
                </div>
                {order.paymentId && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Payment ID</p>
                    <p className="text-base font-mono text-xs">{order.paymentId}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatCurrency(order.shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (GST)</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {onStatusUpdate && (
              <Button onClick={onStatusUpdate}>
                <Edit className="h-4 w-4 mr-2" />
                Update Status
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

