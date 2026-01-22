"use client";

import ProductManagement from "@/components/admin/ProductManagement";

export default function ProductsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                <p className="text-muted-foreground">Manage your product catalog</p>
            </div>
            <ProductManagement />
        </div>
    );
}
