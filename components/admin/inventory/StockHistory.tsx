"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2, ArrowUp, ArrowDown, Download, Calendar } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { format } from "date-fns";
import { toast } from "sonner";

interface StockMovement {
  id: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    image: string;
    category: string;
  };
  type: "IN" | "OUT" | "ADJUSTMENT" | "RETURN" | "TRANSFER";
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string | null;
  referenceId?: string | null;
  referenceType?: string | null;
  createdBy?: string | null;
  createdAt: Date;
}

export function StockHistory() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchMovements();
  }, [page, type, search, startDate, endDate]);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: "20",
      };

      if (search) params.search = search;
      if (type !== "all") params.type = type;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await apiClient.get<StockMovement[]>(
        `/inventory/movements`,
        params
      );

      if (response.success && response.data) {
        setMovements(response.data);
        setTotal(response.meta?.total || 0);
        setTotalPages(response.meta?.totalPages || 0);
      }
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      toast.error("Failed to load stock movements");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: Record<string, string> = {
        limit: "10000", // Export all
      };

      if (search) params.search = search;
      if (type !== "all") params.type = type;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await apiClient.get<StockMovement[]>(
        `/inventory/movements`,
        params
      );

      if (response.success && response.data) {
        // Convert to CSV
        const headers = ["Date", "Product", "Type", "Quantity", "Previous Stock", "New Stock", "Reason", "Reference"];
        const rows = response.data.map((movement) => [
          format(new Date(movement.createdAt), "yyyy-MM-dd HH:mm:ss"),
          movement.product?.name || "Unknown",
          movement.type,
          movement.quantity.toString(),
          movement.previousStock.toString(),
          movement.newStock.toString(),
          movement.reason || "",
          movement.referenceId || "",
        ]);

        const csvContent = [
          headers.join(","),
          ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");

        // Download CSV
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `stock-history-${format(new Date(), "yyyy-MM-dd")}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Stock history exported successfully");
      }
    } catch (error) {
      console.error("Error exporting stock movements:", error);
      toast.error("Failed to export stock history");
    } finally {
      setExporting(false);
    }
  };

  const getMovementTypeBadge = (type: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      IN: { label: "In", variant: "default" },
      OUT: { label: "Out", variant: "destructive" },
      ADJUSTMENT: { label: "Adjustment", variant: "secondary" },
      RETURN: { label: "Return", variant: "outline" },
      TRANSFER: { label: "Transfer", variant: "outline" },
    };
    return variants[type] || { label: type, variant: "default" as const };
  };

  const clearFilters = () => {
    setSearch("");
    setType("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Stock Movement History</CardTitle>
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
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by product name or reason..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
              <Select value={type} onValueChange={(value) => { setType(value); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="IN">In</SelectItem>
                  <SelectItem value="OUT">Out</SelectItem>
                  <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                  <SelectItem value="RETURN">Return</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full"
              />
              <Input
                type="date"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full"
              />
            </div>
            {(search || type !== "all" || startDate || endDate) && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <span className="text-sm text-muted-foreground">
                  {total} movement{total !== 1 ? "s" : ""} found
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Previous</TableHead>
                  <TableHead className="text-right">New</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No stock movements found
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((movement) => {
                    const typeBadge = getMovementTypeBadge(movement.type);
                    const isIncrease = movement.quantity > 0;
                    return (
                      <TableRow key={movement.id}>
                        <TableCell className="text-sm">
                          <div className="flex flex-col">
                            <span>{format(new Date(movement.createdAt), "MMM dd, yyyy")}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(movement.createdAt), "HH:mm:ss")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {movement.product?.name || "Unknown Product"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isIncrease ? (
                              <ArrowUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowDown className="h-4 w-4 text-red-600" />
                            )}
                            <span className={`font-semibold ${isIncrease ? "text-green-600" : "text-red-600"}`}>
                              {Math.abs(movement.quantity)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {movement.previousStock}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {movement.newStock}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {movement.reason || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {movement.referenceId ? (
                            <Badge variant="outline" className="text-xs">
                              {movement.referenceType || "REF"}
                            </Badge>
                          ) : (
                            "-"
                          )}
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
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} movements
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
    </div>
  );
}
