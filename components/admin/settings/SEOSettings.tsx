"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface SEOSettings {
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string;
  ogImage?: string;
  twitterHandle?: string;
  facebookUrl?: string;
  instagramUrl?: string;
}

export function SEOSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<SEOSettings>({
    siteTitle: "Nextin Jewellery",
    siteDescription: "Premium Jewellery Store",
    siteKeywords: "",
    ogImage: "",
    twitterHandle: "",
    facebookUrl: "",
    instagramUrl: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get<SEOSettings>("/settings/seo");
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
      await apiClient.put("/settings/seo", formData);
      toast.success("SEO settings saved successfully");
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
          <CardTitle>SEO Settings</CardTitle>
          <CardDescription>
            Configure search engine optimization and social media settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="siteTitle">Site Title *</Label>
            <Input
              id="siteTitle"
              value={formData.siteTitle}
              onChange={(e) => setFormData({ ...formData, siteTitle: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              The title of your website (appears in browser tabs and search results)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteDescription">Site Description *</Label>
            <Textarea
              id="siteDescription"
              value={formData.siteDescription}
              onChange={(e) => setFormData({ ...formData, siteDescription: e.target.value })}
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              A brief description of your website (appears in search results, 150-160 characters recommended)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteKeywords">Site Keywords</Label>
            <Input
              id="siteKeywords"
              value={formData.siteKeywords || ""}
              onChange={(e) => setFormData({ ...formData, siteKeywords: e.target.value })}
              placeholder="jewellery, gold, silver, diamonds, rings, necklaces"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated keywords relevant to your store
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ogImage">Open Graph Image URL</Label>
            <Input
              id="ogImage"
              type="url"
              value={formData.ogImage || ""}
              onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
              placeholder="https://example.com/og-image.jpg"
            />
            <p className="text-xs text-muted-foreground">
              Image URL for social media sharing (recommended: 1200x630px)
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="twitterHandle">Twitter Handle</Label>
              <Input
                id="twitterHandle"
                value={formData.twitterHandle || ""}
                onChange={(e) => setFormData({ ...formData, twitterHandle: e.target.value })}
                placeholder="@yourhandle"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebookUrl">Facebook URL</Label>
              <Input
                id="facebookUrl"
                type="url"
                value={formData.facebookUrl || ""}
                onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Instagram URL</Label>
              <Input
                id="instagramUrl"
                type="url"
                value={formData.instagramUrl || ""}
                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                placeholder="https://instagram.com/yourhandle"
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

