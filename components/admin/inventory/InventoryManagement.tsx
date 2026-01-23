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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
        <p className="text-muted-foreground">
          Manage stock levels, track movements, and monitor inventory health
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InventoryOverview />
        </div>
        <div>
          <LowStockAlerts />
        </div>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Stock History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <InventoryTable />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <StockHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}

