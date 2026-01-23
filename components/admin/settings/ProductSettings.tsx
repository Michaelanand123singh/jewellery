"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface ProductSettings {
  defaultStockThreshold: number;
  autoGenerateSlug: boolean;
  requireProductImage: boolean;
  allowNegativeStock: boolean;
  defaultTaxRate: number;
  enableReviews: boolean;
  requireReviewApproval: boolean;
}

export function ProductSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProductSettings>({
    defaultStockThreshold: 10,
    autoGenerateSlug: true,
    requireProductImage: true,
    allowNegativeStock: false,
    defaultTaxRate: 0,
    enableReviews: true,
    requireReviewApproval: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get<ProductSettings>("/api/v1/settings/product");
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
      await apiClient.put("/api/v1/settings/product", formData);
      toast.success("Product settings saved successfully");
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
          <CardTitle>Product Settings</CardTitle>
          <CardDescription>
            Configure default product behavior and inventory rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultStockThreshold">Default Stock Threshold</Label>
              <Input
                id="defaultStockThreshold"
                type="number"
                min="0"
                value={formData.defaultStockThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, defaultStockThreshold: parseInt(e.target.value) || 0 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Products below this quantity will be marked as low stock
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
              <Input
                id="defaultTaxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.defaultTaxRate}
                onChange={(e) =>
                  setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoGenerateSlug"
                checked={formData.autoGenerateSlug}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, autoGenerateSlug: checked as boolean })
                }
              />
              <Label htmlFor="autoGenerateSlug" className="cursor-pointer">
                Auto-generate product slugs from names
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requireProductImage"
                checked={formData.requireProductImage}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requireProductImage: checked as boolean })
                }
              />
              <Label htmlFor="requireProductImage" className="cursor-pointer">
                Require product image
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="allowNegativeStock"
                checked={formData.allowNegativeStock}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, allowNegativeStock: checked as boolean })
                }
              />
              <Label htmlFor="allowNegativeStock" className="cursor-pointer">
                Allow negative stock quantities
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableReviews"
                checked={formData.enableReviews}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enableReviews: checked as boolean })
                }
              />
              <Label htmlFor="enableReviews" className="cursor-pointer">
                Enable product reviews
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requireReviewApproval"
                checked={formData.requireReviewApproval}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requireReviewApproval: checked as boolean })
                }
                disabled={!formData.enableReviews}
              />
              <Label htmlFor="requireReviewApproval" className="cursor-pointer">
                Require review approval before publishing
              </Label>
            </div>
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

