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
import { Search, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { format } from "date-fns";

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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchMovements();
  }, [page, type, search]);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (search) params.append("search", search);
      if (type !== "all") params.append("type", type);

      const response = await apiClient.get<StockMovement[]>(
        `/api/v1/inventory/movements?${params.toString()}`
      );

      if (response.success && response.data) {
        setMovements(response.data);
        setTotal(response.meta?.total || 0);
        setTotalPages(response.meta?.totalPages || 0);
      }
    } catch (error) {
      console.error("Error fetching stock movements:", error);
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
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
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="IN">In</SelectItem>
            <SelectItem value="OUT">Out</SelectItem>
            <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
            <SelectItem value="RETURN">Return</SelectItem>
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
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Previous</TableHead>
                  <TableHead className="text-right">New</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                          {format(new Date(movement.createdAt), "MMM dd, yyyy HH:mm")}
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
                            <span className="font-semibold">{Math.abs(movement.quantity)}</span>
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

