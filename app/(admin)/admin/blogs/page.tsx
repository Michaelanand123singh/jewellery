"use client";

import BlogManagement from "@/components/admin/BlogManagement";

export default function BlogsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Blogs</h1>
                <p className="text-muted-foreground">Manage your blog posts and articles</p>
            </div>
            <BlogManagement />
        </div>
    );
}

