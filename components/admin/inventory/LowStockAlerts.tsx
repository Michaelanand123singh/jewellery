"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import Image from "next/image";
import Link from "next/link";

interface ProductInventory {
  id: string;
  name: string;
  slug: string;
  image: string;
  category: string;
  price: number;
  stockQuantity: number;
  inStock: boolean;
}

export function LowStockAlerts() {
  const [products, setProducts] = useState<ProductInventory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  const fetchLowStockProducts = async () => {
    try {
      const response = await apiClient.get<ProductInventory[]>(
        "/api/v1/inventory/products?lowStock=true&limit=10"
      );
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error("Error fetching low stock products:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No products with low stock.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          Low Stock Alerts ({products.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {product.category.replace("-", " ")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-yellow-600">
                  {product.stockQuantity} left
                </p>
                <p className="text-xs text-muted-foreground">Low stock</p>
              </div>
            </div>
          ))}
        </div>
        {products.length >= 10 && (
          <div className="mt-4">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/admin/inventory">View All Low Stock Products</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

