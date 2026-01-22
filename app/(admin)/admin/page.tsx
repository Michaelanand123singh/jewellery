"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, ShoppingCart, DollarSign, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface DashboardStats {
    revenue: {
        total: number;
        change: number;
    };
    orders: {
        total: number;
        active: number;
        change: number;
    };
    products: {
        total: number;
        new: number;
        change: number;
    };
    users: {
        total: number;
        new: number;
        change: number;
    };
    recentSales: Array<{
        id: string;
        customerName: string;
        customerEmail: string;
        amount: number;
        date: string;
    }>;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch("/api/admin/stats");
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Overview of your store's performance</p>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.revenue.total)}</div>
                        <p className={`text-xs ${stats.revenue.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {stats.revenue.change >= 0 ? "+" : ""}{stats.revenue.change.toFixed(1)}% from last month
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
                        <p className="text-xs text-muted-foreground">
                            {stats.orders.active} active orders
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
                        <p className="text-xs text-muted-foreground">
                            +{stats.products.change} new products this month
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
                        <p className="text-xs text-muted-foreground">
                            +{stats.users.change} since last week
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Revenue</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px] flex items-center justify-center border-dashed border-2 rounded-md bg-muted/50 text-muted-foreground">
                            Chart Placeholder
                        </div>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.recentSales.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No recent sales
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {stats.recentSales.map((sale) => (
                                    <div key={sale.id} className="flex items-center">
                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                            {getInitials(sale.customerName || sale.customerEmail)}
                                        </div>
                                        <div className="ml-4 space-y-1 flex-1 min-w-0">
                                            <p className="text-sm font-medium leading-none truncate">
                                                {sale.customerName || "Guest"}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {sale.customerEmail}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium text-sm">
                                            {formatCurrency(sale.amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
