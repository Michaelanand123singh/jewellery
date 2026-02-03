"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { OrderStatus } from "@/src/shared/constants/order-status";
import { PaymentStatus } from "@/src/shared/constants/payment-methods";
import { ORDER_STATUS_FLOW, canTransitionOrder } from "@/src/shared/constants/order-status";

interface Order {
  id: string;
  status: string;
  paymentStatus: string;
}

interface OrderStatusUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onSuccess?: () => void;
}

export function OrderStatusUpdateDialog({
  open,
  onOpenChange,
  order,
  onSuccess,
}: OrderStatusUpdateDialogProps) {
  const [status, setStatus] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setPaymentStatus(order.paymentStatus);
      // Get available status transitions
      const currentStatus = order.status as OrderStatus;
      const transitions = ORDER_STATUS_FLOW[currentStatus] || [];
      setAvailableStatuses(transitions.map((s) => s));
    }
  }, [order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    const updateData: any = {};
    if (status !== order.status) {
      // Validate status transition
      if (!canTransitionOrder(order.status as OrderStatus, status as OrderStatus)) {
        toast.error(`Cannot transition from ${order.status} to ${status}`);
        return;
      }
      updateData.status = status;
    }
    if (paymentStatus !== order.paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }

    if (Object.keys(updateData).length === 0) {
      toast.info("No changes to update");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.put(`/orders/${order.id}`, updateData);
      if (response.success) {
        toast.success("Order updated successfully");
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(response.error || "Failed to update order");
      }
    } catch (error: any) {
      console.error("Error updating order:", error);
      toast.error(error.message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            Update the status and payment status for order {order.id.substring(0, 8)}...
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Order Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={order.status}>{order.status} (Current)</SelectItem>
                  {availableStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                  {/* Allow selecting any status for admin override */}
                  {Object.values(OrderStatus).map((s) => {
                    if (s === order.status || availableStatuses.includes(s)) return null;
                    return (
                      <SelectItem key={s} value={s}>
                        {s} (Override)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {status !== order.status && !availableStatuses.includes(status) && (
                <p className="text-xs text-yellow-600">
                  Warning: This is not a standard status transition
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Payment Status</Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger id="paymentStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PaymentStatus).map((ps) => (
                    <SelectItem key={ps} value={ps}>
                      {ps}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

