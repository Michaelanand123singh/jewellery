"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SidebarProvider, useSidebar } from "@/components/admin/SidebarContext";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, checkAuth } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen } = useSidebar();

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      setIsLoading(false);
    };
    init();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "ADMIN") {
        router.push("/");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  const sidebarWidth = isOpen ? "w-64" : "w-16";

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AdminHeader />
      <div className="flex flex-1">
        <aside
          className={cn(
            "hidden flex-col border-r bg-background md:flex inset-y-0 fixed z-10 pt-16 h-full transition-all duration-300",
            sidebarWidth
          )}
        >
          <AdminSidebar className="h-full" isCollapsed={!isOpen} />
        </aside>
        <main
          className={cn(
            "flex-1 pt-16 md:pt-4 transition-all duration-300 overflow-x-hidden",
            isOpen ? "md:pl-64" : "md:pl-16"
          )}
        >
          <div className="p-4 md:p-6 space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}
