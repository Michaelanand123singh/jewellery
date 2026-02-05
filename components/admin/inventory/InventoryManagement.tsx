"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryOverview } from "./InventoryOverview";
import { InventoryTable } from "./InventoryTable";
import { StockHistory } from "./StockHistory";
import { LowStockAlerts } from "./LowStockAlerts";
import { Package, History, AlertTriangle } from "lucide-react";

export default function InventoryManagement() {
  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="px-1">
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
        <p className="text-muted-foreground">
          Manage stock levels, track movements, and monitor inventory health
        </p>
      </div>

      {/* Overview Section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 w-full max-w-full overflow-hidden">
        <div className="lg:col-span-2 w-full overflow-hidden">
          <InventoryOverview />
        </div>
        <div className="w-full overflow-hidden">
          <LowStockAlerts />
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="products" className="space-y-4 w-full">
        {/* Tabs List (scrollable on mobile) */}
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="products" className="flex items-center gap-2 whitespace-nowrap">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>

          <TabsTrigger value="history" className="flex items-center gap-2 whitespace-nowrap">
            <History className="h-4 w-4" />
            Stock History
          </TabsTrigger>
        </TabsList>

        {/* Products Table */}
        <TabsContent value="products" className="space-y-4 w-full">
          <div className="w-full overflow-x-auto">
            <InventoryTable />
          </div>
        </TabsContent>

        {/* Stock History Table */}
        <TabsContent value="history" className="space-y-4 w-full">
          <div className="w-full overflow-x-auto">
            <StockHistory />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
