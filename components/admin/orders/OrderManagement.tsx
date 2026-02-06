"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { format } from "date-fns";
import {
  Loader2,
  Eye,
  Search,
  Download,
  Filter,
  X,
  Package,
  DollarSign,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
import { OrderStatusUpdateDialog } from "./OrderStatusUpdateDialog";

interface Order {
  id: string;
  userId: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  orderItems: Array<{
    id: string;
    quantity: number;
    price: number;
    product?: {
      id: string;
      name: string;
      image: string;
      price: number;
    };
    variant?: {
      id: string;
      name: string;
      sku: string;
    };
  }>;
  address?: {
    id: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  user?: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
}

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  todayOrders: number;
  statusBreakdown: Record<string, number>;
  paymentStatusBreakdown: Record<string, number>;
}

function OrderManagementContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [paymentStatus, setPaymentStatus] = useState<string>("all");
  const [paymentMethod, setPaymentMethod] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const isUpdatingFromUrl = useRef(false);
  const prevSearchParams = useRef<string>("");

  // Initialize from URL parameters
  useEffect(() => {
    const currentParams = searchParams.toString();
    if (currentParams !== prevSearchParams.current) {
      isUpdatingFromUrl.current = true;
      const urlStatus = searchParams.get("status") || "all";
      const urlPaymentStatus = searchParams.get("paymentStatus") || "all";
      const urlPaymentMethod = searchParams.get("paymentMethod") || "all";
      const urlSearch = searchParams.get("search") || "";
      const urlStartDate = searchParams.get("startDate") || "";
      const urlEndDate = searchParams.get("endDate") || "";
      const urlPage = searchParams.get("page");
      const urlSortBy = searchParams.get("sortBy") || "createdAt";
      const urlSortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

      setStatus(urlStatus);
      setPaymentStatus(urlPaymentStatus);
      setPaymentMethod(urlPaymentMethod);
      setSearch(urlSearch);
      setStartDate(urlStartDate);
      setEndDate(urlEndDate);
      setSortBy(urlSortBy);
      setSortOrder(urlSortOrder);
      if (urlPage) {
        setPage(parseInt(urlPage) || 1);
      } else {
        setPage(1);
      }
      prevSearchParams.current = currentParams;
      setTimeout(() => {
        isUpdatingFromUrl.current = false;
      }, 0);
    }
  }, [searchParams]);

  // Update URL when filters change
  useEffect(() => {
    if (isUpdatingFromUrl.current) return;

    const params = new URLSearchParams();

    if (status !== "all") params.set("status", status);
    if (paymentStatus !== "all") params.set("paymentStatus", paymentStatus);
    if (paymentMethod !== "all") params.set("paymentMethod", paymentMethod);
    if (search) params.set("search", search);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (sortBy !== "createdAt") params.set("sortBy", sortBy);
    if (sortOrder !== "desc") params.set("sortOrder", sortOrder);
    if (page > 1) params.set("page", page.toString());

    const newUrl = params.toString() ? `/admin/orders?${params.toString()}` : "/admin/orders";
    const currentUrl = window.location.pathname + window.location.search;
    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [status, paymentStatus, paymentMethod, search, startDate, endDate, page, sortBy, sortOrder, router]);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [page, status, paymentStatus, paymentMethod, search, startDate, endDate, sortBy, sortOrder]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: "20",
        sortBy,
        sortOrder,
      };

      if (search) params.search = search;
      if (status !== "all") params.status = status;
      if (paymentStatus !== "all") params.paymentStatus = paymentStatus;
      if (paymentMethod !== "all") params.paymentMethod = paymentMethod;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await apiClient.get<Order[]>("/orders", params);

      if (response.success && response.data) {
        const newOrders = Array.isArray(response.data) ? response.data : [];
        setOrders(newOrders);
        setTotal(response.meta?.total || 0);
        setTotalPages(response.meta?.totalPages || 0);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setStats({
            totalOrders: data.data.orders?.total || 0,
            totalRevenue: data.data.revenue?.total || 0,
            pendingOrders: data.data.orders?.pending || 0,
            todayOrders: data.data.orders?.today || 0,
            statusBreakdown: data.data.orderStatusBreakdown || {},
            paymentStatusBreakdown: data.data.paymentStatusBreakdown || {},
          });
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  const handleUpdateStatus = (order: Order) => {
    setSelectedOrder(order);
    setStatusDialogOpen(true);
  };

  const handleStatusUpdateSuccess = () => {
    fetchOrders();
    fetchStats();
    setStatusDialogOpen(false);
    setSelectedOrder(null);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: Record<string, string> = {
        limit: "10000",
        sortBy,
        sortOrder,
      };

      if (search) params.search = search;
      if (status !== "all") params.status = status;
      if (paymentStatus !== "all") params.paymentStatus = paymentStatus;
      if (paymentMethod !== "all") params.paymentMethod = paymentMethod;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await apiClient.get<Order[]>("/orders", params);

      if (response.success && response.data) {
        const ordersToExport = Array.isArray(response.data) ? response.data : [];
        const headers = [
          "Order ID",
          "Date",
          "Customer",
          "Email",
          "Phone",
          "Status",
          "Payment Status",
          "Payment Method",
          "Items",
          "Subtotal",
          "Shipping",
          "Tax",
          "Total",
        ];
        const rows = ordersToExport.map((order) => [
          order.id,
          format(new Date(order.createdAt), "yyyy-MM-dd HH:mm:ss"),
          order.user?.name || "Guest",
          order.user?.email || "",
          order.user?.phone || "",
          order.status,
          order.paymentStatus,
          order.paymentMethod,
          order.orderItems.reduce((sum, item) => sum + item.quantity, 0).toString(),
          order.subtotal.toFixed(2),
          order.shipping.toFixed(2),
          order.tax.toFixed(2),
          order.total.toFixed(2),
        ]);

        const csvContent = [
          headers.join(","),
          ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `orders-${format(new Date(), "yyyy-MM-dd")}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Orders exported successfully");
      }
    } catch (error) {
      console.error("Error exporting orders:", error);
      toast.error("Failed to export orders");
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setPaymentStatus("all");
    setPaymentMethod("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "DELIVERED":
        return "default";
      case "CONFIRMED":
      case "PROCESSING":
        return "secondary";
      case "SHIPPED":
        return "outline";
      case "CANCELLED":
      case "RETURNED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
        return "default";
      case "PENDING":
        return "secondary";
      case "FAILED":
        return "destructive";
      case "REFUNDED":
        return "outline";
      default:
        return "outline";
    }
  };

  const hasActiveFilters =
    search || status !== "all" || paymentStatus !== "all" || paymentMethod !== "all" || startDate || endDate;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {!statsLoading && stats && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All time orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">All time revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayOrders.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Orders today</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="flex-1 sm:flex-initial">
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={exporting || loading}
                className="flex-1 sm:flex-initial"
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
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID, customer name, email, or product..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="RETURNED">Returned</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={paymentStatus}
              onValueChange={(value) => {
                setPaymentStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Select
              value={paymentMethod}
              onValueChange={(value) => {
                setPaymentMethod(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="razorpay">Razorpay</SelectItem>
                <SelectItem value="cod">Cash on Delivery</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
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
            />
            <Input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date</SelectItem>
                <SelectItem value="total">Total</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="paymentStatus">Payment Status</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Order ID</TableHead>
                      <TableHead className="min-w-[180px]">Customer</TableHead>
                      <TableHead className="min-w-[120px]">Date</TableHead>
                      <TableHead className="min-w-[80px]">Items</TableHead>
                      <TableHead className="min-w-[100px]">Total</TableHead>
                      <TableHead className="min-w-[120px]">Status</TableHead>
                      <TableHead className="min-w-[120px]">Payment</TableHead>
                      <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium font-mono text-xs">
                            {order.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{order.user?.name || "Guest"}</span>
                              <span className="text-xs text-muted-foreground">{order.user?.email}</span>
                              {order.user?.phone && (
                                <span className="text-xs text-muted-foreground">{order.user.phone}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(order.createdAt), "MMM dd, yyyy")}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(order.createdAt), "HH:mm")}
                            </span>
                          </TableCell>
                          <TableCell>
                            {order.orderItems.reduce((acc, item) => acc + item.quantity, 0)} items
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(order.total)}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(order.status) as any}>{order.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant={getPaymentStatusColor(order.paymentStatus) as any}>
                                {order.paymentStatus}
                              </Badge>
                              <span className="text-xs text-muted-foreground capitalize">
                                {order.paymentMethod}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(order)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(order)}
                              >
                                Update
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} orders
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
        </CardContent>
      </Card>

      <OrderDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        order={selectedOrder}
        onStatusUpdate={() => {
          setDetailsDialogOpen(false);
          handleStatusUpdateSuccess();
        }}
      />

      <OrderStatusUpdateDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        order={selectedOrder}
        onSuccess={handleStatusUpdateSuccess}
      />
    </div>
  );
}

export function OrderManagement() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <OrderManagementContent />
    </Suspense>
  );
}

