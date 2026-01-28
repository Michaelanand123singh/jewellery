"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface GeneralSettings {
  storeName: string;
  storeEmail: string;
  storePhone?: string;
  storeAddress?: string;
  storeCity?: string;
  storeState?: string;
  storeCountry: string;
  storePostalCode?: string;
  currency: string;
  timezone: string;
  language: string;
}

export function GeneralSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<GeneralSettings>({
    storeName: "",
    storeEmail: "",
    storePhone: "",
    storeAddress: "",
    storeCity: "",
    storeState: "",
    storeCountry: "India",
    storePostalCode: "",
    currency: "INR",
    timezone: "Asia/Kolkata",
    language: "en",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // apiClient already prefixes with /api/v1, so we pass the relative path
      const response = await apiClient.get<GeneralSettings>("/settings/general");
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
      // apiClient already prefixes with /api/v1, so we pass the relative path
      await apiClient.put("/settings/general", formData);
      toast.success("General settings saved successfully");
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
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Configure your store's basic information and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name *</Label>
              <Input
                id="storeName"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeEmail">Store Email *</Label>
              <Input
                id="storeEmail"
                type="email"
                value={formData.storeEmail}
                onChange={(e) => setFormData({ ...formData, storeEmail: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storePhone">Store Phone</Label>
              <Input
                id="storePhone"
                value={formData.storePhone || ""}
                onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeAddress">Store Address</Label>
            <Input
              id="storeAddress"
              value={formData.storeAddress || ""}
              onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="storeCity">City</Label>
              <Input
                id="storeCity"
                value={formData.storeCity || ""}
                onChange={(e) => setFormData({ ...formData, storeCity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeState">State</Label>
              <Input
                id="storeState"
                value={formData.storeState || ""}
                onChange={(e) => setFormData({ ...formData, storeState: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storePostalCode">Postal Code</Label>
              <Input
                id="storePostalCode"
                value={formData.storePostalCode || ""}
                onChange={(e) => setFormData({ ...formData, storePostalCode: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="storeCountry">Country</Label>
              <Input
                id="storeCountry"
                value={formData.storeCountry}
                onChange={(e) => setFormData({ ...formData, storeCountry: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              />
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

