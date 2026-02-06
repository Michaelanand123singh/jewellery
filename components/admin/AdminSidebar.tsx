"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    Users,
    ShoppingCart,
    Settings,
    LogOut,
    Menu,
    FileText,
    Warehouse
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useSidebar } from "./SidebarContext";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed?: boolean;
}

export function AdminSidebar({ className, isCollapsed = false }: SidebarProps) {
    const pathname = usePathname();
    const { logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    const routes = [
        {
            href: "/admin",
            label: "Dashboard",
            icon: LayoutDashboard,
            active: pathname === "/admin",
        },
        {
            href: "/admin/products",
            label: "Products",
            icon: Package,
            active: pathname === "/admin/products",
        },
        {
            href: "/admin/blogs",
            label: "Blogs",
            icon: FileText,
            active: pathname === "/admin/blogs",
        },
        {
            href: "/admin/inventory",
            label: "Inventory",
            icon: Warehouse,
            active: pathname === "/admin/inventory",
        },
        {
            href: "/admin/orders",
            label: "Orders",
            icon: ShoppingCart,
            active: pathname === "/admin/orders",
        },
        {
            href: "/admin/users",
            label: "Customers",
            icon: Users,
            active: pathname === "/admin/users",
        },
        {
            href: "/admin/settings",
            label: "Settings",
            icon: Settings,
            active: pathname === "/admin/settings",
        },
    ];

    return (
        <div className={cn("pb-12 min-h-screen border-r bg-background transition-all duration-300", className)}>
            <div className="space-y-4 py-4">
                <div className={cn("px-3 py-2", isCollapsed && "px-2")}>
                    
                    {isCollapsed && (
                        <div className="mb-2 flex justify-center">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-bold text-sm">A</span>
                            </div>
                        </div>
                    )}
                    <div className="space-y-1">
                        {routes.map((route) => (
                            <Button
                                key={route.href}
                                variant={route.active ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start",
                                    isCollapsed && "justify-center px-0"
                                )}
                                asChild
                                title={isCollapsed ? route.label : undefined}
                            >
                                <Link href={route.href}>
                                    <route.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                                    {!isCollapsed && route.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>

                <div className={cn("px-3 py-2 mt-auto", isCollapsed && "px-2")}>
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50",
                            isCollapsed && "justify-center px-0"
                        )}
                        onClick={handleLogout}
                        title={isCollapsed ? "Logout" : undefined}
                    >
                        <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                        {!isCollapsed && "Logout"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function MobileSidebar() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
                <AdminSidebar isCollapsed={false} />
            </SheetContent>
        </Sheet>
    );
}
