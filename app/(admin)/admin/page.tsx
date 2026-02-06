"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    Package, Users, ShoppingCart, DollarSign, Loader2, TrendingUp, TrendingDown,
    AlertTriangle, CheckCircle2, Clock, XCircle, CreditCard, BarChart3,
    ArrowUpRight, ArrowDownRight, Activity, Eye, Target, Zap
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface DashboardStats {
    revenue: {
        total: number;
        today: number;
        week: number;
        change: number;
    };
    orders: {
        total: number;
        today: number;
        week: number;
        active: number;
        pending: number;
        change: number;
    };
    products: {
        total: number;
        new: number;
        change: number;
        lowStock: number;
    };
    users: {
        total: number;
        new: number;
        today: number;
        change: number;
    };
    metrics: {
        averageOrderValue: number;
        conversionRate: number;
        totalTransactions: number;
    };
    orderStatusBreakdown: Record<string, number>;
    paymentStatusBreakdown: Record<string, { count: number; total: number }>;
    topProducts: Array<{
        id: string;
        name: string;
        image: string;
        price: number;
        quantitySold: number;
        revenue: number;
    }>;
    topCustomers: Array<{
        id: string;
        name: string;
        email: string;
        totalSpent: number;
        orderCount: number;
    }>;
    revenueChart: Array<{
        date: string;
        revenue: number;
    }>;
    recentSales: Array<{
        id: string;
        customerName: string;
        customerEmail: string;
        amount: number;
        date: string;
        status: string;
    }>;
}

const ORDER_STATUS_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
    PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
    CONFIRMED: { bg: "bg-blue-100", text: "text-blue-800", icon: CheckCircle2 },
    PROCESSING: { bg: "bg-purple-100", text: "text-purple-800", icon: Activity },
    SHIPPED: { bg: "bg-indigo-100", text: "text-indigo-800", icon: Package },
    DELIVERED: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle2 },
    CANCELLED: { bg: "bg-red-100", text: "text-red-800", icon: XCircle },
    RETURNED: { bg: "bg-orange-100", text: "text-orange-800", icon: ArrowDownRight },
};

const PAYMENT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: "bg-yellow-100", text: "text-yellow-800" },
    PAID: { bg: "bg-green-100", text: "text-green-800" },
    FAILED: { bg: "bg-red-100", text: "text-red-800" },
    REFUNDED: { bg: "bg-orange-100", text: "text-orange-800" },
};

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState("30d");

    useEffect(() => {
        fetchStats();
        // Auto-refresh every 60 seconds
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, [timeRange]);

    const fetchStats = async () => {
        try {
            const response = await fetch(`/api/admin/stats?range=${timeRange}`);
            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getStatusBadge = (status: string, type: 'order' | 'payment' = 'order') => {
        if (type === 'order') {
            const config = ORDER_STATUS_COLORS[status] || ORDER_STATUS_COLORS.PENDING;
            const Icon = config.icon || Clock;
            return (
                <Badge className={`${config.bg} ${config.text} border-0`}>
                    <Icon className="h-3 w-3 mr-1" />
                    {status}
                </Badge>
            );
        } else {
            const config = PAYMENT_STATUS_COLORS[status] || PAYMENT_STATUS_COLORS.PENDING;
            return (
                <Badge className={`${config.bg} ${config.text} border-0`}>
                    {status}
                </Badge>
            );
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">Failed to load dashboard statistics</p>
            </div>
        );
    }

    // Calculate max revenue for chart scaling
    const maxRevenue = Math.max(...stats.revenueChart.map(d => d.revenue), 1);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">Overview of your store's performance</p>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                        <SelectItem value="1y">Last year</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.revenue.total)}</div>
                        <div className="flex items-center text-xs mt-1">
                            {stats.revenue.change >= 0 ? (
                                <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                            ) : (
                                <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                            )}
                            <span className={stats.revenue.change >= 0 ? "text-green-600" : "text-red-600"}>
                                {stats.revenue.change >= 0 ? "+" : ""}{stats.revenue.change.toFixed(1)}% from last month
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Today: {formatCurrency(stats.revenue.today)} • Week: {formatCurrency(stats.revenue.week)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.orders.total.toLocaleString()}</div>
                        <div className="flex items-center gap-2 text-xs mt-1">
                            <span className="text-muted-foreground">Today: {stats.orders.today}</span>
                            {stats.orders.pending > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                    {stats.orders.pending} pending
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.orders.active} orders in last hour
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Products</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.products.total.toLocaleString()}</div>
                        <div className="flex items-center gap-2 text-xs mt-1">
                            <span className="text-muted-foreground">+{stats.products.new} this month</span>
                            {stats.products.lowStock > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {stats.products.lowStock} low stock
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.products.change} new products added
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.users.total.toLocaleString()}</div>
                        <div className="flex items-center text-xs mt-1">
                            <span className="text-muted-foreground">
                                +{stats.users.new} this week • +{stats.users.today} today
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.users.change} new users since last week
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.metrics.averageOrderValue)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Based on {stats.metrics.totalTransactions} transactions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.metrics.conversionRate.toFixed(2)}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Orders per user ratio
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.metrics.totalTransactions.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            This month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.orders.pending}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Requires attention
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts and Breakdowns */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                {/* Revenue Chart */}
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div>
                                <CardTitle className="text-lg sm:text-xl">Revenue Trend</CardTitle>
                                <CardDescription className="text-xs sm:text-sm">Last 30 days revenue</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] sm:h-[300px] flex items-end justify-between gap-1 overflow-x-auto">
                            {stats.revenueChart.map((day, index) => (
                                <div key={day.date} className="flex-1 flex flex-col items-center group">
                                    <div
                                        className="w-full bg-primary rounded-t transition-all hover:bg-primary/80 cursor-pointer relative group"
                                        style={{
                                            height: `${(day.revenue / maxRevenue) * 100}%`,
                                            minHeight: day.revenue > 0 ? '4px' : '0',
                                        }}
                                        title={`${format(new Date(day.date), 'MMM dd')}: ${formatCurrency(day.revenue)}`}
                                    >
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                                            {format(new Date(day.date), 'MMM dd')}: {formatCurrency(day.revenue)}
                                        </div>
                                    </div>
                                    {index % 5 === 0 && (
                                        <span className="text-[10px] text-muted-foreground mt-1">
                                            {format(new Date(day.date), 'MMM dd')}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Order Status Breakdown */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Order Status</CardTitle>
                        <CardDescription>Current order distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(stats.orderStatusBreakdown).map(([status, count]) => {
                                const total = Object.values(stats.orderStatusBreakdown).reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? (count / total) * 100 : 0;
                                const config = ORDER_STATUS_COLORS[status] || ORDER_STATUS_COLORS.PENDING;
                                const Icon = config.icon || Clock;
                                
                                return (
                                    <div key={status} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <Icon className={`h-4 w-4 ${config.text}`} />
                                                <span className="font-medium">{status}</span>
                                            </div>
                                            <span className="text-muted-foreground">{count}</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className={`${config.bg} h-2 rounded-full transition-all`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payment Status and Top Products */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
                {/* Payment Status Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Status</CardTitle>
                        <CardDescription>Payment distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(stats.paymentStatusBreakdown).map(([status, data]) => {
                                const total = Object.values(stats.paymentStatusBreakdown).reduce((a, b) => a + b.count, 0);
                                const percentage = total > 0 ? (data.count / total) * 100 : 0;
                                const config = PAYMENT_STATUS_COLORS[status] || PAYMENT_STATUS_COLORS.PENDING;
                                
                                return (
                                    <div key={status} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <Badge className={`${config.bg} ${config.text} border-0`}>
                                                    {status}
                                                </Badge>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium">{data.count}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {formatCurrency(data.total)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className={`${config.bg} h-2 rounded-full transition-all`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Top Products</CardTitle>
                                <CardDescription>Best selling products this month</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/products">View All</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {stats.topProducts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No sales data available
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {stats.topProducts.slice(0, 5).map((product, index) => (
                                    <div key={product.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-2 sm:p-0">
                                        <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                {index + 1}
                                            </div>
                                            {product.image && (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-12 h-12 object-cover rounded"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{product.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {product.quantitySold} sold • {formatCurrency(product.revenue)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium">{formatCurrency(product.price)}</div>
                                            <div className="text-xs text-muted-foreground">per unit</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Top Customers and Recent Sales */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {/* Top Customers */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Top Customers</CardTitle>
                                <CardDescription>Highest value customers</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/users">View All</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {stats.topCustomers.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No customer data available
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {stats.topCustomers.slice(0, 5).map((customer, index) => (
                                    <div key={customer.id} className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                            {getInitials(customer.name || customer.email)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{customer.name || 'Guest'}</p>
                                            <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium">{formatCurrency(customer.totalSpent)}</div>
                                            <div className="text-xs text-muted-foreground">{customer.orderCount} orders</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Sales */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Recent Sales</CardTitle>
                                <CardDescription>Latest transactions</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/orders">View All</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {stats.recentSales.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No recent sales
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {stats.recentSales.map((sale) => (
                                    <div key={sale.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                                                {getInitials(sale.customerName || sale.customerEmail)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium leading-none truncate">
                                                    {sale.customerName || "Guest"}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {format(new Date(sale.date), 'MMM dd, yyyy')}
                                                    </p>
                                                    {getStatusBadge(sale.status)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-auto font-medium text-sm flex-shrink-0">
                                            {formatCurrency(sale.amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                        <Button variant="outline" className="h-auto flex-col py-4" asChild>
                            <Link href="/admin/products">
                                <Package className="h-5 w-5 mb-2" />
                                <span className="text-sm">Add Product</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-auto flex-col py-4" asChild>
                            <Link href="/admin/orders">
                                <ShoppingCart className="h-5 w-5 mb-2" />
                                <span className="text-sm">View Orders</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-auto flex-col py-4" asChild>
                            <Link href="/admin/inventory">
                                <BarChart3 className="h-5 w-5 mb-2" />
                                <span className="text-sm">Inventory</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-auto flex-col py-4" asChild>
                            <Link href="/admin/users">
                                <Users className="h-5 w-5 mb-2" />
                                <span className="text-sm">Manage Users</span>
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
