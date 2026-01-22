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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Order {
    id: string;
    total: number;
    status: string;
    createdAt: string;
    user: {
        name: string | null;
        email: string;
    };
    orderItems: {
        id: string;
        quantity: number;
        price: number;
        product: {
            name: string;
        };
    }[];
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await fetch("/api/orders");
            const data = await response.json();
            if (data.success) {
                setOrders(data.data);
            } else {
                toast.error("Failed to fetch orders");
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error("Error fetching orders");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "completed":
            case "delivered":
                return "default"; // or green/success if you have it
            case "processing":
                return "secondary";
            case "cancelled":
                return "destructive";
            default:
                return "outline";
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
                <p className="text-muted-foreground">Manage customer orders</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[100px]">Order ID</TableHead>
                                    <TableHead className="min-w-[150px]">Customer</TableHead>
                                    <TableHead className="min-w-[100px]">Date</TableHead>
                                    <TableHead className="min-w-[80px]">Items</TableHead>
                                    <TableHead className="min-w-[100px]">Total</TableHead>
                                    <TableHead className="min-w-[100px]">Status</TableHead>
                                    <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                                                    <span>{order.user?.name || "Guest"}</span>
                                                    <span className="text-xs text-muted-foreground">{order.user?.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{format(new Date(order.createdAt), "PP")}</TableCell>
                                            <TableCell>
                                                {order.orderItems.reduce((acc, item) => acc + item.quantity, 0)} items
                                            </TableCell>
                                            <TableCell>₹{order.total.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusColor(order.status) as any}>
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
