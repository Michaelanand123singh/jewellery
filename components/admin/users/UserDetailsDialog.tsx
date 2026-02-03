"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { User, Mail, Phone, Shield, Calendar, ShoppingCart, MapPin, Heart, Star, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { Loader2 } from "lucide-react";

interface UserDetails {
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
  orders?: Array<{
    id: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
}

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    role: string;
    provider: string;
    createdAt: string;
  } | null;
}

export function UserDetailsDialog({
  open,
  onOpenChange,
  user,
}: UserDetailsDialogProps) {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchUserDetails();
    }
  }, [open, user]);

  const fetchUserDetails = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await apiClient.get<UserDetails>(`/users/${user.id}`);
      if (response.success && response.data) {
        setUserDetails(response.data);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>User Details</span>
            <Badge variant={userDetails?.role === "ADMIN" ? "default" : "secondary"}>
              {userDetails?.role || user.role}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            User ID: {user.id}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : userDetails ? (
          <div className="space-y-4">
            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-xl">
                    {getInitials(userDetails.name)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{userDetails.name || "N/A"}</h3>
                    <p className="text-sm text-muted-foreground">{userDetails.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-base">{userDetails.email}</p>
                    </div>
                  </div>
                  {userDetails.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Phone</p>
                        <p className="text-base">{userDetails.phone}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Role</p>
                      <Badge variant={userDetails.role === "ADMIN" ? "default" : "secondary"}>
                        {userDetails.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Provider</p>
                      <Badge variant="outline" className="capitalize">
                        {userDetails.provider}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Joined</p>
                      <p className="text-base">
                        {format(new Date(userDetails.createdAt), "PPpp")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {userDetails._count?.orders || 0}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <ShoppingCart className="h-3 w-3" />
                      Orders
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(userDetails.totalSpent || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {userDetails._count?.addresses || 0}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Addresses
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {userDetails._count?.wishlistItems || 0}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Heart className="h-3 w-3" />
                      Wishlist
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {userDetails._count?.reviews || 0}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Star className="h-3 w-3" />
                      Reviews
                    </p>
                  </div>
                </div>
                {userDetails.lastOrderDate && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Last Order: {format(new Date(userDetails.lastOrderDate), "PPpp")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Orders */}
            {userDetails.orders && userDetails.orders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {userDetails.orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium font-mono text-xs">{order.id.substring(0, 8)}...</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(order.createdAt), "PPp")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(order.total)}</p>
                          <Badge variant="outline">{order.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

