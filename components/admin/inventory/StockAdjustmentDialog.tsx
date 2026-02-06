"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface Product {
  id: string;
  name: string;
  stockQuantity: number;
}

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess?: () => void;
}

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: StockAdjustmentDialogProps) {
  const [quantity, setQuantity] = useState("");
  const [type, setType] = useState<"IN" | "OUT" | "ADJUSTMENT">("ADJUSTMENT");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product) return;

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum === 0) {
      toast.error("Please enter a valid non-zero quantity");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason for the adjustment");
      return;
    }

    setLoading(true);

    try {
      // Determine if it's an addition or subtraction
      const adjustmentQuantity = type === "IN" ? quantityNum : -quantityNum;

      await apiClient.post("/inventory/movements", {
        productId: product.id,
        quantity: adjustmentQuantity,
        reason: reason.trim(),
        type,
      });

      toast.success("Stock adjusted successfully");
      setQuantity("");
      setReason("");
      setType("ADJUSTMENT");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to adjust stock");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (value: string) => {
    // Allow negative numbers for adjustments
    if (value === "" || value === "-") {
      setQuantity(value);
      return;
    }
    const num = parseInt(value);
    if (!isNaN(num)) {
      setQuantity(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            {product && (
              <>
                Adjust stock for <strong>{product.name}</strong>
                <br />
                Current stock: <strong>{product.stockQuantity}</strong>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Adjustment Type</Label>
              <Select value={type} onValueChange={(value: any) => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">Add Stock</SelectItem>
                  <SelectItem value="OUT">Remove Stock</SelectItem>
                  <SelectItem value="ADJUSTMENT">Manual Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity {type === "IN" ? "(to add)" : type === "OUT" ? "(to remove)" : "(positive to add, negative to remove)"}
              </Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                placeholder={type === "IN" ? "Enter quantity to add" : type === "OUT" ? "Enter quantity to remove" : "Enter quantity (use - for removal)"}
                required
                min={type === "OUT" ? 1 : undefined}
              />
              {type === "ADJUSTMENT" && quantity && !isNaN(parseInt(quantity)) && (
                <p className="text-xs text-muted-foreground">
                  New stock will be:{" "}
                  <strong>
                    {product
                      ? product.stockQuantity + parseInt(quantity)
                      : 0}
                  </strong>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for this stock adjustment"
                required
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adjust Stock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

