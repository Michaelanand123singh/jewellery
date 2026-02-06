import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { apiClient, ApiError } from './api-client';

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  images?: string[];
  description?: string | null;
  category: string;
  rating?: number | null;
  reviewCount?: number;
  inStock?: boolean;
  stockQuantity?: number | null; // Available stock quantity
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CartItem extends Product {
  quantity: number;
  cartItemId?: string; // Backend cart item ID for efficient updates/deletes
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncFromBackend: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
}

interface WishlistStore {
  items: Product[];
  isLoading: boolean;
  addItem: (product: Product) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  syncFromBackend: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
}

interface AuthStore {
  user: User | null;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => {
      let isSyncing = false; // Guard to prevent concurrent syncs
      
      return {
        items: [],
        isLoading: false,
        syncFromBackend: async () => {
          // Get user from auth store
          const authStore = useAuthStore.getState();
          if (!authStore.user) {
            // Not logged in, keep local storage cart
            return;
          }

          // Prevent concurrent syncs
          if (isSyncing) {
            return;
          }
          
          isSyncing = true;
          set({ isLoading: true });
          
          try {
            const response = await apiClient.get<{ items: any[] }>('/cart');
            if (response.success && response.data) {
              // Convert backend cart items to CartItem format
              // Store cartItemId for efficient updates/deletes (fixes Issue #1)
              const backendItems: CartItem[] = response.data.items.map((item: any) => ({
                ...item.product,
                quantity: item.quantity,
                cartItemId: item.id, // Store backend cart item ID
              }));
              
              // Get current local items
              const localItems = get().items;
              
              // Merge strategy: Combine backend and local
              // For same products, prefer backend (source of truth)
              // Keep local items that aren't in backend (newly added before sync)
              const mergedMap = new Map<string, CartItem>();
              
              // Add local items first
              localItems.forEach(item => {
                mergedMap.set(item.id, { ...item });
              });
              
              // Overlay backend items (backend wins for conflicts - it's the source of truth)
              backendItems.forEach(item => {
                mergedMap.set(item.id, { ...item });
              });
              
              const mergedItems = Array.from(mergedMap.values());
              set({ items: mergedItems });
              
              // Sync any local-only items to backend (items added while logged out)
              const localOnly = localItems.filter(
                local => !backendItems.some(backend => backend.id === local.id)
              );
              
              if (localOnly.length > 0) {
                // Sync local-only items to backend in background
                Promise.all(
                  localOnly.map(item =>
                    apiClient.post('/cart', { productId: item.id, quantity: item.quantity }).catch(err => {
                      console.error(`Failed to sync item ${item.id}:`, err);
                    })
                  )
                );
              }
            } else {
              // Backend cart is empty, but keep local items
              // They'll be synced when user adds more items or explicitly syncs
            }
          } catch (error) {
            console.error('Failed to sync cart from backend:', error);
            toast.error('Failed to sync cart. Some items may not be saved.');
            // Keep local storage cart on error
          } finally {
            set({ isLoading: false });
            isSyncing = false;
          }
      },
      addItem: async (product, quantity = 1) => {
        // Check authentication - user must be logged in to add to cart
        const authStore = useAuthStore.getState();
        if (!authStore.user) {
          throw new Error('Authentication required. Please sign in to add items to cart.');
        }

        // Stock validation (fixes Issue #5)
        if (product.inStock === false) {
          throw new Error('Product is out of stock');
        }
        
        if (product.stockQuantity !== undefined && product.stockQuantity !== null) {
          const items = get().items;
          const existingItem = items.find((item) => item.id === product.id);
          const currentCartQuantity = existingItem?.quantity || 0;
          const newTotalQuantity = currentCartQuantity + quantity;
          
          if (newTotalQuantity > product.stockQuantity) {
            throw new Error(
              `Only ${product.stockQuantity} items available. You already have ${currentCartQuantity} in cart.`
            );
          }
        }
        
        const items = get().items;
        const existingItem = items.find((item) => item.id === product.id);
        const oldQuantity = existingItem?.quantity || 0;

        // Update local state immediately for responsive UI
        if (existingItem) {
          set({
            items: items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({
            items: [...items, { ...product, quantity }],
          });
        }

        // Sync to backend (user is authenticated at this point)
        try {
          const response = await apiClient.post<{ id: string }>('/cart', { productId: product.id, quantity });
          if (response.success && response.data?.id) {
            // Store cartItemId from response for efficient future updates/deletes
            set({
              items: get().items.map((item) =>
                item.id === product.id
                  ? { ...item, cartItemId: response.data!.id }
                  : item
              ),
            });
          }
        } catch (error: any) {
          console.error('Failed to sync cart to backend:', error);
          // Revert local change on error
          if (existingItem) {
            set({
              items: items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: oldQuantity }
                  : item
              ),
            });
          } else {
            set({ items });
          }
          toast.error(error.message || 'Cart updated locally but may not sync to server');
        }
      },
      removeItem: async (productId) => {
        const items = get().items;
        const itemToRemove = items.find((item) => item.id === productId);

        // Update local state immediately
        set({
          items: items.filter((item) => item.id !== productId),
        });

        // Sync to backend if logged in (using stored cartItemId - fixes Issue #1)
        const authStore = useAuthStore.getState();
        if (authStore.user && itemToRemove?.cartItemId) {
          try {
            // Use stored cartItemId directly - no need for GET request
            await apiClient.delete(`/cart/${itemToRemove.cartItemId}`);
          } catch (error: any) {
            // Revert on network error
            set({ items: [...get().items, itemToRemove] });
            console.error('Failed to sync cart removal to backend:', error);
            toast.error(error.message || 'Failed to remove item. Please try again.');
          }
        }
      },
      updateQuantity: async (productId, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(productId);
          return;
        }

        const items = get().items;
        const existingItem = items.find((item) => item.id === productId);
        
        if (!existingItem) {
          throw new Error('Item not found in cart');
        }
        
        // Stock validation (fixes Issue #5)
        if (existingItem.stockQuantity !== undefined && existingItem.stockQuantity !== null) {
          if (quantity > existingItem.stockQuantity) {
            throw new Error(
              `Only ${existingItem.stockQuantity} items available.`
            );
          }
        }
        
        const oldQuantity = existingItem.quantity;

        // Update local state immediately
        set({
          items: items.map((item) =>
            item.id === productId ? { ...item, quantity } : item
          ),
        });

        // Sync to backend if logged in (using stored cartItemId - fixes Issue #1)
        const authStore = useAuthStore.getState();
        if (authStore.user && existingItem?.cartItemId) {
          try {
            // Use stored cartItemId directly - no need for GET request
            await apiClient.put(`/cart/${existingItem.cartItemId}`, { quantity });
          } catch (error: any) {
            // Revert local change on error
            set({
              items: items.map((item) =>
                item.id === productId
                  ? { ...item, quantity: oldQuantity }
                  : item
              ),
            });
            console.error('Failed to sync cart update to backend:', error);
            toast.error(error.message || 'Failed to update quantity. Please try again.');
          }
        }
      },
      clearCart: async () => {
        // Update local state immediately
        set({ items: [] });

        // Sync to backend if logged in
        const authStore = useAuthStore.getState();
        if (authStore.user) {
          try {
            await apiClient.delete('/cart');
          } catch (error: any) {
            console.error('Failed to sync cart clear to backend:', error);
            toast.warning(error.message || 'Cart cleared locally but may not sync to server');
            // Keep local change even if sync fails
          }
        }
      },
      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
      };
    },
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => {
      let isSyncing = false; // Guard to prevent concurrent syncs
      
      return {
        items: [],
        isLoading: false,
        syncFromBackend: async () => {
          // Get user from auth store
          const authStore = useAuthStore.getState();
          if (!authStore.user) {
            // Not logged in, keep local storage wishlist
            return;
          }

          // Prevent concurrent syncs
          if (isSyncing) {
            return;
          }
          
          isSyncing = true;
          set({ isLoading: true });
          
          try {
            const response = await apiClient.get<{ items: any[] }>('/wishlist');
            if (response.success && response.data) {
              // Convert backend wishlist items to Product format
              const backendItems: Product[] = response.data.items.map((item: any) => ({
                ...item.product,
              }));
              
              // Get current local items
              const localItems = get().items;
              
              // Merge strategy: Combine backend and local
              // Backend is source of truth, but keep local items not in backend
              const mergedMap = new Map<string, Product>();
              
              // Add local items first
              localItems.forEach(item => {
                mergedMap.set(item.id, { ...item });
              });
              
              // Overlay backend items (backend wins for conflicts)
              backendItems.forEach(item => {
                mergedMap.set(item.id, { ...item });
              });
              
              const mergedItems = Array.from(mergedMap.values());
              set({ items: mergedItems });
              
              // Sync any local-only items to backend (items added while logged out)
              const localOnly = localItems.filter(
                local => !backendItems.some(backend => backend.id === local.id)
              );
              
              if (localOnly.length > 0) {
                // Sync local-only items to backend in background
                Promise.all(
                  localOnly.map(item =>
                    apiClient.post('/wishlist', { productId: item.id }).catch(err => {
                      console.error(`Failed to sync wishlist item ${item.id}:`, err);
                    })
                  )
                );
              }
            } else {
              // Backend wishlist is empty, but keep local items
            }
          } catch (error) {
            console.error('Failed to sync wishlist from backend:', error);
            toast.error('Failed to sync wishlist. Some items may not be saved.');
            // Keep local storage wishlist on error
          } finally {
            set({ isLoading: false });
            isSyncing = false;
          }
      },
      addItem: async (product) => {
        // Check authentication - user must be logged in to add to wishlist
        const authStore = useAuthStore.getState();
        if (!authStore.user) {
          throw new Error('Authentication required. Please sign in to add items to wishlist.');
        }

        if (get().isInWishlist(product.id)) {
          return; // Already in wishlist
        }

        // Update local state immediately
        set({ items: [...get().items, product] });

        // Sync to backend (user is authenticated at this point)
        try {
          await apiClient.post('/wishlist', { productId: product.id });
        } catch (error: any) {
          // Revert local change on error
          set({
            items: get().items.filter((item) => item.id !== product.id),
          });
          console.error('Failed to sync wishlist to backend:', error);
          toast.error(error.message || 'Wishlist updated locally but may not sync to server');
        }
      },
      removeItem: async (productId) => {
        const items = get().items;
        const removedItem = items.find((item) => item.id === productId); // Store before removing

        // Update local state immediately
        set({
          items: items.filter((item) => item.id !== productId),
        });

        // Sync to backend if logged in
        const authStore = useAuthStore.getState();
        if (authStore.user && removedItem) {
          try {
            await apiClient.delete('/wishlist', { productId });
          } catch (error: any) {
            // Revert local change on error (restore item)
            const currentItems = get().items;
            set({ items: [...currentItems, removedItem] }); // Add removed item back
            console.error('Failed to sync wishlist removal to backend:', error);
            toast.error(error.message || 'Failed to remove item. Please try again.');
          }
        }
      },
      isInWishlist: (productId) => {
        return get().items.some((item) => item.id === productId);
      },
      };
    },
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useAuthStore = create<AuthStore>()((set, get) => {
  let checkingAuth = false; // Flag to prevent concurrent calls
  let authPromise: Promise<void> | null = null; // Store the promise to share across concurrent calls

  return {
    user: null,
    setUser: (user) => set({ user }),
    checkAuth: async () => {
      // Prevent concurrent calls - return existing promise if one is in flight
      if (checkingAuth && authPromise) {
        return authPromise;
      }

      checkingAuth = true;
      
      authPromise = (async () => {
        try {
          const response = await apiClient.get<User>('/auth/me');
          if (response.success && response.data) {
            set({ user: response.data });
          } else {
            set({ user: null });
          }
        } catch (error: any) {
          // 401 errors are expected for non-authenticated users - handle silently
          // Only log unexpected errors (non-401)
          if (error?.status !== 401) {
            console.error('Auth check failed:', error);
          }
          set({ user: null });
        } finally {
          checkingAuth = false;
          authPromise = null;
        }
      })();

      return authPromise;
    },
    logout: async () => {
      try {
        await apiClient.post('/auth/logout');
      } catch (error) {
        console.error('Logout failed:', error);
      }
      set({ user: null });
    },
  };
});
