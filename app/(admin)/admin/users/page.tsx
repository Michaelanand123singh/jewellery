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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface User {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    role: "USER" | "ADMIN";
    createdAt: string;
    _count: {
        orders: number;
    };
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch("/api/users");
            const data = await response.json();
            if (data.success) {
                setUsers(data.data);
            } else {
                toast.error("Failed to fetch users");
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Error fetching users");
        } finally {
            setLoading(false);
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
                <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
                <p className="text-muted-foreground">Manage your registered customers</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Customers</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[120px]">Name</TableHead>
                                    <TableHead className="min-w-[180px]">Email</TableHead>
                                    <TableHead className="min-w-[120px]">Phone</TableHead>
                                    <TableHead className="min-w-[80px]">Role</TableHead>
                                    <TableHead className="min-w-[80px]">Orders</TableHead>
                                    <TableHead className="min-w-[120px]">Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No users found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                                {user.name || "N/A"}
                                            </TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{user.phone || "N/A"}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{user._count?.orders || 0}</TableCell>
                                            <TableCell>
                                                {format(new Date(user.createdAt), "PPP")}
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
