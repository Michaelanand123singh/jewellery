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
  Users,
  UserPlus,
  UserCheck,
  TrendingUp,
  Shield,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { UserDetailsDialog } from "./UserDetailsDialog";
import { UserEditDialog } from "./UserEditDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    orders: number;
    addresses: number;
    cartItems: number;
    wishlistItems: number;
    reviews: number;
  };
  totalSpent?: number;
  lastOrderDate?: string | null;
}

interface UserStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalAdmins: number;
  totalCustomers: number;
  usersWithOrders: number;
  usersWithoutOrders: number;
  roleBreakdown: Record<string, number>;
  providerBreakdown: Record<string, number>;
  topCustomers: Array<{
    id: string;
    name: string | null;
    email: string;
    totalSpent: number;
    orderCount: number;
  }>;
}

function UserManagementContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("all");
  const [provider, setProvider] = useState<string>("all");
  const [hasOrders, setHasOrders] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
      const urlRole = searchParams.get("role") || "all";
      const urlProvider = searchParams.get("provider") || "all";
      const urlHasOrders = searchParams.get("hasOrders") || "all";
      const urlSearch = searchParams.get("search") || "";
      const urlStartDate = searchParams.get("startDate") || "";
      const urlEndDate = searchParams.get("endDate") || "";
      const urlPage = searchParams.get("page");
      const urlSortBy = searchParams.get("sortBy") || "createdAt";
      const urlSortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

      setRole(urlRole);
      setProvider(urlProvider);
      setHasOrders(urlHasOrders);
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

    if (role !== "all") params.set("role", role);
    if (provider !== "all") params.set("provider", provider);
    if (hasOrders !== "all") params.set("hasOrders", hasOrders);
    if (search) params.set("search", search);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (sortBy !== "createdAt") params.set("sortBy", sortBy);
    if (sortOrder !== "desc") params.set("sortOrder", sortOrder);
    if (page > 1) params.set("page", page.toString());

    const newUrl = params.toString() ? `/admin/users?${params.toString()}` : "/admin/users";
    const currentUrl = window.location.pathname + window.location.search;
    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [role, provider, hasOrders, search, startDate, endDate, page, sortBy, sortOrder, router]);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [page, role, provider, hasOrders, search, startDate, endDate, sortBy, sortOrder]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: "20",
        sortBy,
        sortOrder,
      };

      if (search) params.search = search;
      if (role !== "all") params.role = role;
      if (provider !== "all") params.provider = provider;
      if (hasOrders !== "all") params.hasOrders = hasOrders;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await apiClient.get<User[]>("/users", params);

      if (response.success && response.data) {
        const newUsers = Array.isArray(response.data) ? response.data : [];
        setUsers(newUsers);
        setTotal(response.meta?.total || 0);
        setTotalPages(response.meta?.totalPages || 0);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await apiClient.get<UserStats>("/users/stats");
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setDetailsDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    setDeleting(true);
    try {
      const response = await apiClient.delete(`/users/${selectedUser.id}`);
      if (response.success) {
        toast.success("User deleted successfully");
        fetchUsers();
        fetchStats();
        setDeleteDialogOpen(false);
        setSelectedUser(null);
      } else {
        toast.error(response.error || "Failed to delete user");
      }
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateSuccess = () => {
    fetchUsers();
    fetchStats();
    setEditDialogOpen(false);
    setSelectedUser(null);
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
      if (role !== "all") params.role = role;
      if (provider !== "all") params.provider = provider;
      if (hasOrders !== "all") params.hasOrders = hasOrders;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await apiClient.get<User[]>("/users", params);

      if (response.success && response.data) {
        const usersToExport = Array.isArray(response.data) ? response.data : [];
        const headers = [
          "ID",
          "Name",
          "Email",
          "Phone",
          "Role",
          "Provider",
          "Orders",
          "Total Spent",
          "Addresses",
          "Cart Items",
          "Wishlist Items",
          "Reviews",
          "Joined Date",
        ];
        const rows = usersToExport.map((user) => [
          user.id,
          user.name || "N/A",
          user.email,
          user.phone || "N/A",
          user.role,
          user.provider,
          (user._count?.orders || 0).toString(),
          (user.totalSpent || 0).toFixed(2),
          (user._count?.addresses || 0).toString(),
          (user._count?.cartItems || 0).toString(),
          (user._count?.wishlistItems || 0).toString(),
          (user._count?.reviews || 0).toString(),
          format(new Date(user.createdAt), "yyyy-MM-dd HH:mm:ss"),
        ]);

        const csvContent = [
          headers.join(","),
          ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `users-${format(new Date(), "yyyy-MM-dd")}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Users exported successfully");
      }
    } catch (error) {
      console.error("Error exporting users:", error);
      toast.error("Failed to export users");
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setRole("all");
    setProvider("all");
    setHasOrders("all");
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

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const hasActiveFilters =
    search || role !== "all" || provider !== "all" || hasOrders !== "all" || startDate || endDate;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {!statsLoading && stats && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.newUsersToday} new today • {stats.newUsersThisWeek} this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.usersWithOrders} with orders • {stats.usersWithoutOrders} without orders
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAdmins.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Administrative users</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.newUsersThisMonth.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">New registrations</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
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
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select value={role} onValueChange={(value) => { setRole(value); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="USER">Customer</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={provider}
              onValueChange={(value) => {
                setProvider(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                <SelectItem value="local">Local</SelectItem>
                <SelectItem value="google">Google</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Select
              value={hasOrders}
              onValueChange={(value) => {
                setHasOrders(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="true">With Orders</SelectItem>
                <SelectItem value="false">Without Orders</SelectItem>
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
                <SelectItem value="createdAt">Date Joined</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="email">Email</SelectItem>
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

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
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
                      <TableHead className="min-w-[200px]">User</TableHead>
                      <TableHead className="min-w-[180px]">Email</TableHead>
                      <TableHead className="min-w-[120px]">Phone</TableHead>
                      <TableHead className="min-w-[100px]">Role</TableHead>
                      <TableHead className="min-w-[100px]">Provider</TableHead>
                      <TableHead className="min-w-[80px]">Orders</TableHead>
                      <TableHead className="min-w-[120px]">Total Spent</TableHead>
                      <TableHead className="min-w-[120px]">Joined</TableHead>
                      <TableHead className="text-right min-w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                                {getInitials(user.name)}
                              </div>
                              <div>
                                <p className="font-medium">{user.name || "N/A"}</p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {user.id.substring(0, 8)}...
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phone || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {user.provider}
                            </Badge>
                          </TableCell>
                          <TableCell>{user._count?.orders || 0}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(user.totalSpent || 0)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(user.createdAt), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(user)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(user)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(user)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
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
                    Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} users
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

      <UserDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        user={selectedUser}
      />

      <UserEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={selectedUser}
        onSuccess={handleUpdateSuccess}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.name || selectedUser?.email}? This
              action cannot be undone and will delete all associated data including orders,
              addresses, and reviews.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function UserManagement() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <UserManagementContent />
    </Suspense>
  );
}

