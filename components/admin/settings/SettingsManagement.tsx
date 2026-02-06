"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralSettings } from "./GeneralSettings";
import { ProductSettings } from "./ProductSettings";
import { CategoryManagement } from "./CategoryManagement";
import { ShippingSettings } from "./ShippingSettings";
import { PaymentSettings } from "./PaymentSettings";
import { EmailSettings } from "./EmailSettings";
import { SEOSettings } from "./SEOSettings";
import {
  Settings,
  Package,
  FolderTree,
  Truck,
  CreditCard,
  Mail,
  Search,
} from "lucide-react";

export default function SettingsManagement() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Configure your store settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="flex w-full overflow-x-auto lg:overflow-visible gap-2 sm:gap-4
 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 scrollbar-hide ">
          <TabsTrigger value="general" className="flex items-center gap-2 shrink-0">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="product" className="flex items-center gap-2 shrink-0">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Products</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2 shrink-0">
            <FolderTree className="h-4 w-4" />
            <span className="hidden sm:inline">Categories</span>
          </TabsTrigger>
          <TabsTrigger value="shipping" className="flex items-center gap-2 shrink-0">
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Shipping</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2 shrink-0">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payment</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2 shrink-0">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2 shrink-0">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">SEO</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="product" className="space-y-4">
          <ProductSettings />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoryManagement />
        </TabsContent>

        <TabsContent value="shipping" className="space-y-4">
          <ShippingSettings />
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <PaymentSettings />
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <EmailSettings />
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <SEOSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

