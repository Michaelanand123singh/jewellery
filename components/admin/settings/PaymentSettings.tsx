"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface PaymentSettings {
  enablePayments: boolean;
  paymentMethods: string; // JSON string
  currency: string;
  enableCOD: boolean;
  enableOnlinePayment: boolean;
}

export function PaymentSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<PaymentSettings>({
    enablePayments: true,
    paymentMethods: "[]",
    currency: "INR",
    enableCOD: true,
    enableOnlinePayment: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get<PaymentSettings>("/settings/payment");
      if (response.success && response.data) {
        setFormData(response.data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await apiClient.put("/settings/payment", formData);
      toast.success("Payment settings saved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>
            Configure payment methods and options for your store.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enablePayments"
              checked={formData.enablePayments}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enablePayments: checked as boolean })
              }
            />
            <Label htmlFor="enablePayments" className="cursor-pointer">
              Enable payments
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              placeholder="INR"
            />
            <p className="text-xs text-muted-foreground">
              Currency code (e.g., INR, USD, EUR)
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableCOD"
                checked={formData.enableCOD}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enableCOD: checked as boolean })
                }
                disabled={!formData.enablePayments}
              />
              <Label htmlFor="enableCOD" className="cursor-pointer">
                Enable Cash on Delivery (COD)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableOnlinePayment"
                checked={formData.enableOnlinePayment}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enableOnlinePayment: checked as boolean })
                }
                disabled={!formData.enablePayments}
              />
              <Label htmlFor="enableOnlinePayment" className="cursor-pointer">
                Enable Online Payment (Razorpay/Stripe)
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethods">Payment Methods (JSON)</Label>
            <Textarea
              id="paymentMethods"
              value={formData.paymentMethods}
              onChange={(e) =>
                setFormData({ ...formData, paymentMethods: e.target.value })
              }
              rows={6}
              placeholder='[{"name": "Razorpay", "enabled": true}, {"name": "Stripe", "enabled": false}]'
            />
            <p className="text-xs text-muted-foreground">
              JSON array of payment methods configuration
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

