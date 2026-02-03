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

interface ShippingSettings {
  enableShipping: boolean;
  freeShippingThreshold: number;
  defaultShippingCost: number;
  shippingMethods: string; // JSON string
}

export function ShippingSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ShippingSettings>({
    enableShipping: true,
    freeShippingThreshold: 0,
    defaultShippingCost: 0,
    shippingMethods: "[]",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get<ShippingSettings>("/settings/shipping");
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
      await apiClient.put("/settings/shipping", formData);
      toast.success("Shipping settings saved successfully");
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
          <CardTitle>Shipping Settings</CardTitle>
          <CardDescription>
            Configure shipping options and costs for your store.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enableShipping"
              checked={formData.enableShipping}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enableShipping: checked as boolean })
              }
            />
            <Label htmlFor="enableShipping" className="cursor-pointer">
              Enable shipping
            </Label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="freeShippingThreshold">Free Shipping Threshold</Label>
              <Input
                id="freeShippingThreshold"
                type="number"
                min="0"
                step="0.01"
                value={formData.freeShippingThreshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    freeShippingThreshold: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Minimum order amount for free shipping (in {formData.defaultShippingCost > 0 ? "currency" : "INR"})
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultShippingCost">Default Shipping Cost</Label>
              <Input
                id="defaultShippingCost"
                type="number"
                min="0"
                step="0.01"
                value={formData.defaultShippingCost}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultShippingCost: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Default shipping cost when free shipping threshold is not met
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shippingMethods">Shipping Methods (JSON)</Label>
            <Textarea
              id="shippingMethods"
              value={formData.shippingMethods}
              onChange={(e) =>
                setFormData({ ...formData, shippingMethods: e.target.value })
              }
              rows={6}
              placeholder='[{"name": "Standard", "cost": 50, "days": "3-5"}, {"name": "Express", "cost": 100, "days": "1-2"}]'
            />
            <p className="text-xs text-muted-foreground">
              JSON array of shipping methods. Each method should have: name, cost, and days (delivery time)
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

