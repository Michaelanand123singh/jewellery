"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchLowStockProducts(true);
  }, []);

  const fetchLowStockProducts = async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : page;
      const response = await apiClient.get<ProductInventory[]>(
        "/inventory/products",
        {
          lowStock: "true",
          limit: ITEMS_PER_PAGE.toString(),
          page: currentPage.toString(),
        }
      );

      if (response.success && response.data) {
        const newProducts = Array.isArray(response.data) ? response.data : [];
        
        if (reset) {
          setProducts(newProducts);
        } else {
          setProducts((prev) => [...prev, ...newProducts]);
        }

        const totalCount = response.meta?.total || 0;
        setTotal(totalCount);
        const totalPages = response.meta?.totalPages || 0;
        setHasMore(currentPage < totalPages);

        if (!reset) {
          setPage((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error("Error fetching low stock products:", error);
      toast.error("Failed to load low stock products");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    fetchLowStockProducts(false);
    // Scroll to bottom of container after loading
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
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
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Low Stock Alerts
          </div>
          {total > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              {total}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
        {/* Scrollable container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-6 pb-4 space-y-3"
          style={{ maxHeight: "600px" }}
        >
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
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-yellow-600">
                  {product.stockQuantity} left
                </p>
                <p className="text-xs text-muted-foreground">Low stock</p>
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Load More ({total - products.length} remaining)
                  </>
                )}
              </Button>
            </div>
          )}

          {/* View All Link */}
          {products.length > 0 && (
            <div className="pt-2 border-t">
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link href="/admin/inventory?filter=lowStock">
                  View All in Inventory Table
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
