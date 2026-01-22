"use client";

import { UserCircle } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { MobileSidebar } from "./AdminSidebar";

export function AdminHeader() {
    const { user } = useAuthStore();

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b bg-background px-4 sm:px-6">
            <MobileSidebar />
            <div className="flex flex-1 items-center justify-between">
                <div className="md:hidden font-semibold ml-2 text-sm">Admin Panel</div>
                <div className="ml-auto flex items-center space-x-2 sm:space-x-4">
                    <div className="flex items-center space-x-2 text-xs sm:text-sm">
                        <UserCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="font-medium text-muted-foreground hidden sm:inline">
                            {user?.name || user?.email || "Admin"}
                        </span>
                        <span className="font-medium text-muted-foreground sm:hidden">
                            {user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "Admin"}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
