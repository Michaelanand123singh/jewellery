"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Search, Loader2, Download, Package, DollarSign } from "lucide-react";
import Image from "next/image";
import { apiClient } from "@/lib/api-client";
import { StockAdjustmentDialog } from "./StockAdjustmentDialog";
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
  lowStockThreshold?: number;
  lastMovementDate?: Date;
  totalMovements?: number;
}

function InventoryTableContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<ProductInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductInventory | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Initialize state from URL parameters on mount and when URL changes
  const isUpdatingFromUrl = useRef(false);
  const prevSearchParams = useRef<string>("");
  
  useEffect(() => {
    const currentParams = searchParams.toString();
    // Only update if URL params actually changed
    if (currentParams !== prevSearchParams.current) {
      isUpdatingFromUrl.current = true;
      const urlFilter = searchParams.get("filter") || "all";
      const urlCategory = searchParams.get("category") || "all";
      const urlSearch = searchParams.get("search") || "";
      const urlPage = searchParams.get("page");

      setFilter(urlFilter);
      setCategory(urlCategory);
      setSearch(urlSearch);
      if (urlPage) {
        setPage(parseInt(urlPage) || 1);
      } else {
        setPage(1);
      }
      prevSearchParams.current = currentParams;
      // Use setTimeout to ensure state updates complete before allowing URL updates
      setTimeout(() => {
        isUpdatingFromUrl.current = false;
      }, 0);
    }
  }, [searchParams]);

  // Update URL when filter changes (but not when updating from URL)
  useEffect(() => {
    if (isUpdatingFromUrl.current) return;
    
    const params = new URLSearchParams();
    
    if (filter !== "all") {
      params.set("filter", filter);
    }
    
    if (category !== "all") {
      params.set("category", category);
    }
    
    if (search) {
      params.set("search", search);
    }
    
    if (page > 1) {
      params.set("page", page.toString());
    }

    const newUrl = params.toString() ? `/admin/inventory?${params.toString()}` : "/admin/inventory";
    const currentUrl = window.location.pathname + window.location.search;
    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [filter, category, search, page, router]);

  useEffect(() => {
    fetchProducts();
  }, [page, category, filter, search, sortBy, sortOrder]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: "20",
      };

      if (search) params.search = search;
      if (category !== "all") params.category = category;
      if (filter === "lowStock") params.lowStock = "true";
      if (filter === "outOfStock") params.outOfStock = "true";
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;

      const response = await apiClient.get<ProductInventory[]>(
        `/inventory/products`,
        params
      );

      if (response.success && response.data) {
        setProducts(response.data);
        setTotal(response.meta?.total || 0);
        setTotalPages(response.meta?.totalPages || 0);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = (product: ProductInventory) => {
    setSelectedProduct(product);
    setAdjustmentDialogOpen(true);
  };

  const handleAdjustmentSuccess = () => {
    fetchProducts();
    setSelectedProducts(new Set());
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(products.map(p => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: Record<string, string> = {
        limit: "10000", // Export all
      };

      if (search) params.search = search;
      if (category !== "all") params.category = category;
      if (filter === "lowStock") params.lowStock = "true";
      if (filter === "outOfStock") params.outOfStock = "true";

      const response = await apiClient.get<ProductInventory[]>(
        `/inventory/products`,
        params
      );

      if (response.success && response.data) {
        // Convert to CSV
        const headers = ["Product Name", "Category", "Price", "Stock Quantity", "Stock Value", "Status", "In Stock"];
        const rows = response.data.map((product) => {
          const stockValue = product.price * product.stockQuantity;
          const status = getStockStatus(product);
          return [
            product.name,
            product.category,
            product.price.toString(),
            product.stockQuantity.toString(),
            stockValue.toFixed(2),
            status.label,
            product.inStock ? "Yes" : "No",
          ];
        });

        const csvContent = [
          headers.join(","),
          ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");

        // Download CSV
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `inventory-${new Date().toISOString().split("T")[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Inventory exported successfully");
      }
    } catch (error) {
      console.error("Error exporting inventory:", error);
      toast.error("Failed to export inventory");
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStockStatus = (product: ProductInventory) => {
    if (!product.inStock || product.stockQuantity === 0) {
      return { label: "Out of Stock", variant: "destructive" as const };
    }
    const threshold = product.lowStockThreshold || 10;
    if (product.stockQuantity <= threshold) {
      return { label: "Low Stock", variant: "secondary" as const };
    }
    return { label: "In Stock", variant: "default" as const };
  };

  const calculateTotalStockValue = () => {
    return products.reduce((sum, product) => sum + (product.price * product.stockQuantity), 0);
  };

  const calculateTotalStockQuantity = () => {
    return products.reduce((sum, product) => sum + product.stockQuantity, 0);
  };

  const allSelected = products.length > 0 && selectedProducts.size === products.length;
  const someSelected = selectedProducts.size > 0 && selectedProducts.size < products.length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Stock Quantity</p>
                <p className="text-2xl font-bold">{calculateTotalStockQuantity().toLocaleString()}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Stock Value</p>
                <p className="text-2xl font-bold">{formatCurrency(calculateTotalStockValue())}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={(value) => { setCategory(value); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="women">Women</SelectItem>
              <SelectItem value="kids">Kids</SelectItem>
              <SelectItem value="artificial">Artificial</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter} onValueChange={(value) => { setFilter(value); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="lowStock">Low Stock</SelectItem>
              <SelectItem value="outOfStock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          {selectedProducts.size > 0 && (
            <Badge variant="secondary" className="px-3 py-1">
              {selectedProducts.size} selected
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting || loading}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="stockQuantity">Stock</SelectItem>
            <SelectItem value="price">Price</SelectItem>
            <SelectItem value="category">Category</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="w-[100px]">Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Stock Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => {
                    const status = getStockStatus(product);
                    const stockValue = product.price * product.stockQuantity;
                    const isSelected = selectedProducts.has(product.id);
                    return (
                      <TableRow key={product.id} className={isSelected ? "bg-muted/50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                            aria-label={`Select ${product.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="relative w-16 h-16 rounded-md overflow-hidden">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="capitalize">
                          {product.category.replace("-", " ")}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {product.stockQuantity}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatCurrency(stockValue)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAdjustStock(product)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Adjust
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} products
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <StockAdjustmentDialog
        open={adjustmentDialogOpen}
        onOpenChange={setAdjustmentDialogOpen}
        product={selectedProduct}
        onSuccess={handleAdjustmentSuccess}
      />
    </div>
  );
}

export function InventoryTable() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <InventoryTableContent />
    </Suspense>
  );
}
