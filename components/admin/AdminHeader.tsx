"use client";

import { UserCircle, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { MobileSidebar } from "./AdminSidebar";
import { useSidebar } from "./SidebarContext";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export function AdminHeader() {
    const { user } = useAuthStore();
    const { isOpen, toggle } = useSidebar();

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b bg-background px-4 sm:px-6">
            {/* Left Section: Mobile Sidebar & Desktop Toggle */}
            <div className="flex items-center">
                <MobileSidebar />
                <div className="hidden md:flex items-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggle}
                        className="mr-2"
                        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
                    >
                        {isOpen ? (
                            <PanelLeftClose className="h-5 w-5" />
                        ) : (
                            <PanelLeftOpen className="h-5 w-5" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Center Section: Logo */}
            <div className="flex-1 flex items-center justify-center">
                <Link href="/admin" className="flex items-center">
                    <Image
                        src="/img/logo-adronx.webp"
                        alt="Adorné"
                        width={180}
                        height={60}
                        priority
                        className="h-10 sm:h-12 md:h-14 w-auto object-contain"
                    />
                </Link>
            </div>

            {/* Right Section: User Info */}
            <div className="flex items-center space-x-2 sm:space-x-4">
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
        </header>
    );
}
