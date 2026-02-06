"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, ShoppingCart, Heart } from "lucide-react";

interface LoginRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionType?: "cart" | "wishlist";
  onLoginSuccess?: () => void;
}

export function LoginRequiredModal({
  open,
  onOpenChange,
  actionType = "cart",
  onLoginSuccess,
}: LoginRequiredModalProps) {
  const router = useRouter();

  const handleLogin = () => {
    onOpenChange(false);
    if (onLoginSuccess) {
      onLoginSuccess();
    }
    router.push("/login");
  };

  const handleRegister = () => {
    onOpenChange(false);
    if (onLoginSuccess) {
      onLoginSuccess();
    }
    router.push("/register");
  };

  const handleCancel = () => {
    onOpenChange(false);
    sessionStorage.removeItem("pendingAction");
  };

  const actionIcon = actionType === "cart" ? ShoppingCart : Heart;
  const actionText = actionType === "cart" ? "add items to your cart" : "save items to your wishlist";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {actionIcon === ShoppingCart ? (
                <ShoppingCart className="h-8 w-8 text-primary" />
              ) : (
                <Heart className="h-8 w-8 text-primary" />
              )}
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">
            Sign In Required
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Please sign in to {actionText} and enjoy a personalized shopping experience.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Save your {actionType === "cart" ? "cart" : "wishlist"} across devices</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Track your orders and get updates</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Access exclusive offers and discounts</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto order-3 sm:order-1"
          >
            Cancel
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

