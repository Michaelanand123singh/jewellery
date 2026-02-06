"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal";
import { useAuthStore } from "@/lib/store";

type PendingAction = {
  type: "cart" | "wishlist";
  productId: string;
  product: any; // Product object
  quantity?: number;
};

interface AuthRequiredContextType {
  requireAuth: (
    actionType: "cart" | "wishlist",
    product: any,
    quantity?: number
  ) => Promise<boolean>;
  executePendingAction: () => Promise<void>;
}

const AuthRequiredContext = createContext<AuthRequiredContextType | null>(null);

export function useAuthRequired() {
  const context = useContext(AuthRequiredContext);
  if (!context) {
    throw new Error("useAuthRequired must be used within AuthRequiredProvider");
  }
  return context;
}

export function AuthRequiredProvider({ children }: { children: React.ReactNode }) {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const router = useRouter();
  const { user, checkAuth } = useAuthStore();

  const executePendingAction = useCallback(async () => {
    if (!pendingAction || !user) {
      return;
    }

    const actionToExecute = pendingAction; // Capture current pending action

    try {
      if (actionToExecute.type === "cart") {
        const { useCartStore } = await import("@/lib/store");
        const cartStore = useCartStore.getState();
        await cartStore.addItem(actionToExecute.product, actionToExecute.quantity || 1);
      } else if (actionToExecute.type === "wishlist") {
        const { useWishlistStore } = await import("@/lib/store");
        const wishlistStore = useWishlistStore.getState();
        await wishlistStore.addItem(actionToExecute.product);
      }

      // Clear pending action
      setPendingAction(null);
      setLoginModalOpen(false);
    } catch (error) {
      console.error("Failed to execute pending action:", error);
    }
  }, [pendingAction, user]);

  // Check for pending action after login
  useEffect(() => {
    if (user && pendingAction) {
      executePendingAction();
    }
  }, [user, pendingAction, executePendingAction]);

  const requireAuth = useCallback(
    async (
      actionType: "cart" | "wishlist",
      product: any,
      quantity?: number
    ): Promise<boolean> => {
      // Check current auth state
      await checkAuth();
      const currentUser = useAuthStore.getState().user;

      if (currentUser) {
        // User is authenticated, proceed with action
        return true;
      }

      // User is not authenticated, store pending action and show login modal
      setPendingAction({ type: actionType, productId: product.id, product, quantity });
      setLoginModalOpen(true);
      return false;
    },
    [checkAuth]
  );

  const handleLoginSuccess = useCallback(() => {
    // This will be triggered after login, the useEffect will handle execution
    setLoginModalOpen(false);
  }, []);

  const handleModalClose = useCallback((open: boolean) => {
    if (!open) {
      setPendingAction(null);
    }
    setLoginModalOpen(open);
  }, []);

  return (
    <AuthRequiredContext.Provider value={{ requireAuth, executePendingAction }}>
      {children}
      <LoginRequiredModal
        open={loginModalOpen}
        onOpenChange={handleModalClose}
        actionType={pendingAction?.type || "cart"}
        onLoginSuccess={handleLoginSuccess}
      />
    </AuthRequiredContext.Provider>
  );
}

