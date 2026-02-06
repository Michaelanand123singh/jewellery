"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store";
import { LogIn, UserPlus, Sparkles } from "lucide-react";

const FIRST_VISIT_KEY = "adorne_first_visit_shown";

// Pages where we should not show the modal
const EXCLUDED_PATHS = ["/login", "/register", "/admin"];

export function FirstVisitLoginModal() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, checkAuth } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Don't show on excluded paths
    if (EXCLUDED_PATHS.some(path => pathname?.startsWith(path))) {
      setIsChecking(false);
      return;
    }

    const checkFirstVisit = async () => {
      try {
        // Check if user is already logged in
        await checkAuth();
        
        // Wait a bit for auth check to complete
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Get current user state after auth check
        const currentUser = useAuthStore.getState().user;
        
        // Check if modal was already shown
        const hasShownModal = localStorage.getItem(FIRST_VISIT_KEY);
        
        // Only show if:
        // 1. User is not logged in
        // 2. Modal hasn't been shown before
        // 3. Not on excluded paths (already checked above)
        if (!currentUser && !hasShownModal) {
          // Small delay to ensure page is fully loaded
          setTimeout(() => {
            setOpen(true);
          }, 1500);
        }
      } catch (error) {
        console.error("Error checking first visit:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkFirstVisit();
  }, [pathname, checkAuth]);

  const handleClose = () => {
    setOpen(false);
    // Mark as shown so it doesn't appear again
    if (typeof window !== "undefined") {
      localStorage.setItem(FIRST_VISIT_KEY, "true");
    }
  };

  const handleLogin = () => {
    handleClose();
    router.push("/login");
  };

  const handleRegister = () => {
    handleClose();
    router.push("/register");
  };

  const handleContinueAsGuest = () => {
    handleClose();
  };

  // Don't render anything while checking, if user is logged in, or on excluded paths
  if (isChecking || user || EXCLUDED_PATHS.some(path => pathname?.startsWith(path))) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">
            Welcome to Adorne Luxe Jewellery
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Sign in to unlock exclusive benefits and personalized shopping experience
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Faster checkout and order tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Save items to your wishlist</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Exclusive offers and early access to sales</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Manage multiple shipping addresses</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleContinueAsGuest}
            className="w-full sm:w-auto order-3 sm:order-1"
          >
            Continue as Guest
          </Button>
          <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
            <Button
              variant="outline"
              onClick={handleRegister}
              className="flex-1 sm:flex-initial"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Register
            </Button>
            <Button
              onClick={handleLogin}
              className="flex-1 sm:flex-initial"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

