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

interface EmailSettings {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure: boolean;
  fromEmail: string;
  fromName: string;
}

export function EmailSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<EmailSettings>({
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    smtpSecure: true,
    fromEmail: "noreply@nextinjewellery.com",
    fromName: "Nextin Jewellery",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get<EmailSettings>("/settings/email");
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
      await apiClient.put("/settings/email", formData);
      toast.success("Email settings saved successfully");
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
          <CardTitle>Email Settings</CardTitle>
          <CardDescription>
            Configure SMTP settings for sending emails from your store.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input
                id="smtpHost"
                value={formData.smtpHost || ""}
                onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input
                id="smtpPort"
                type="number"
                min="1"
                max="65535"
                value={formData.smtpPort || 587}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    smtpPort: parseInt(e.target.value) || 587,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Common ports: 587 (TLS), 465 (SSL), 25 (unsecured)
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtpUser">SMTP Username</Label>
              <Input
                id="smtpUser"
                value={formData.smtpUser || ""}
                onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                placeholder="your-email@gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPassword">SMTP Password</Label>
              <Input
                id="smtpPassword"
                type="password"
                value={formData.smtpPassword || ""}
                onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                placeholder="Your SMTP password or app password"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="smtpSecure"
              checked={formData.smtpSecure}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, smtpSecure: checked as boolean })
              }
            />
            <Label htmlFor="smtpSecure" className="cursor-pointer">
              Use secure connection (TLS/SSL)
            </Label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email *</Label>
              <Input
                id="fromEmail"
                type="email"
                value={formData.fromEmail}
                onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Email address that will appear as the sender
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name *</Label>
              <Input
                id="fromName"
                value={formData.fromName}
                onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Name that will appear as the sender
              </p>
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

