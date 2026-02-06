# Cart & Wishlist Authentication Root-Level Fix

## Problem Analysis

The cart and wishlist functionality had a critical flaw:

1. **No Authentication Check**: Users could add items to cart and wishlist without being logged in
2. **Local Storage Only**: Items were stored in local storage but not persisted to backend for non-authenticated users
3. **Confusing UX**: Users thought items were saved, but they weren't actually persisted
4. **No Login Prompt**: System didn't prompt users to login before adding items

## Root Cause

The frontend store (`lib/store.ts`) allowed adding items to cart/wishlist even when users were not authenticated:
- Items were added to local storage immediately
- Backend sync only happened if user was logged in
- No authentication check before allowing the action
- No login prompt when user tried to add items

## Root-Level Solution

### 1. Created Login Required Modal (`components/auth/LoginRequiredModal.tsx`)

**Purpose**: Modal that prompts users to login when they try to add items without authentication.

**Features**:
- Shows appropriate icon (cart or wishlist) based on action type
- Provides login and register options
- Explains benefits of signing in
- Can be triggered programmatically

### 2. Created Auth Required Provider (`components/providers/AuthRequiredProvider.tsx`)

**Purpose**: Global context provider that manages authentication-required actions.

**Key Features**:
- `requireAuth()` function: Checks if user is authenticated, shows login modal if not
- Stores pending actions when user is not authenticated
- Automatically executes pending actions after successful login
- Uses React Context for global state management

**Flow**:
1. User clicks "Add to Cart" or "Add to Wishlist"
2. `requireAuth()` checks authentication status
3. If authenticated → proceed with action
4. If not authenticated → show login modal and store pending action
5. After login → automatically execute pending action

### 3. Updated Store Methods (`lib/store.ts`)

**Changes to `useCartStore.addItem`**:
- Added authentication check at the start
- Throws error if user is not authenticated
- Removed conditional backend sync (user is guaranteed to be authenticated)

**Changes to `useWishlistStore.addItem`**:
- Added authentication check at the start
- Throws error if user is not authenticated
- Removed conditional backend sync (user is guaranteed to be authenticated)

**Before**:
```typescript
addItem: async (product, quantity = 1) => {
  // Add to local storage immediately
  set({ items: [...items, product] });
  
  // Sync to backend if logged in
  const authStore = useAuthStore.getState();
  if (authStore.user) {
    // Sync...
  }
}
```

**After**:
```typescript
addItem: async (product, quantity = 1) => {
  // Check authentication - user must be logged in
  const authStore = useAuthStore.getState();
  if (!authStore.user) {
    throw new Error('Authentication required. Please sign in to add items to cart.');
  }
  
  // Add to local storage and sync to backend
  // (user is guaranteed to be authenticated at this point)
}
```

### 4. Updated Frontend Components

**ProductCard** (`components/home/ProductCard.tsx`):
- Uses `useAuthRequired()` hook
- Checks authentication before calling store methods
- Shows login modal if not authenticated

**ProductListItem** (`components/home/ProductListItem.tsx`):
- Uses `useAuthRequired()` hook
- Checks authentication before calling store methods
- Shows login modal if not authenticated

**Product Detail Page** (`app/(public)/products/[id]/page.tsx`):
- Uses `useAuthRequired()` hook
- Checks authentication for both "Add to Cart" and "Buy Now" actions
- Checks authentication for wishlist actions

**Before**:
```typescript
const handleAddToCart = async () => {
  try {
    await addToCart(product);
    toast.success('Added to cart!');
  } catch (error) {
    toast.error(error.message);
  }
};
```

**After**:
```typescript
const handleAddToCart = async () => {
  const isAuthenticated = await requireAuth("cart", product);
  if (isAuthenticated) {
    try {
      await addToCart(product);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error(error.message);
    }
  }
};
```

### 5. Added Provider to Layout (`app/layout.tsx`)

- Wrapped application with `AuthRequiredProvider`
- Makes `useAuthRequired()` hook available throughout the app
- Manages login modal state globally

## Flow Diagram

### Before (Broken):
```
User clicks "Add to Cart"
  ↓
Item added to local storage (even if not logged in)
  ↓
If logged in → sync to backend
If not logged in → item only in local storage (not persisted)
```

### After (Fixed):
```
User clicks "Add to Cart"
  ↓
Check authentication
  ↓
If authenticated → Add to cart → Sync to backend
If not authenticated → Show login modal → Store pending action
  ↓
User logs in
  ↓
Automatically execute pending action → Add to cart → Sync to backend
```

## Benefits

1. **Data Persistence**: Items are only added when user is authenticated, ensuring they're saved to backend
2. **Better UX**: Clear login prompt when action requires authentication
3. **Consistency**: All cart/wishlist actions require authentication
4. **Automatic Execution**: Pending actions execute automatically after login
5. **Security**: Prevents unauthorized cart/wishlist manipulation
6. **User Experience**: Users understand they need to login to save items

## Files Modified

1. `components/auth/LoginRequiredModal.tsx` - New component for login prompt
2. `components/providers/AuthRequiredProvider.tsx` - New provider for auth-required actions
3. `lib/store.ts` - Updated cart and wishlist store methods to require authentication
4. `components/home/ProductCard.tsx` - Added auth check before adding to cart/wishlist
5. `components/home/ProductListItem.tsx` - Added auth check before adding to cart/wishlist
6. `app/(public)/products/[id]/page.tsx` - Added auth check for product detail page actions
7. `app/layout.tsx` - Added AuthRequiredProvider to root layout
8. `app/(auth)/login/page.tsx` - Added delay to allow auth state propagation

## Testing Checklist

- [ ] User not logged in clicks "Add to Cart" → Login modal appears
- [ ] User not logged in clicks "Add to Wishlist" → Login modal appears
- [ ] User logs in from modal → Item is automatically added to cart/wishlist
- [ ] User cancels login modal → No action is performed
- [ ] User already logged in clicks "Add to Cart" → Item added immediately
- [ ] User already logged in clicks "Add to Wishlist" → Item added immediately
- [ ] Items are persisted to backend after login
- [ ] Cart and wishlist sync correctly after login

## Migration Notes

- No database migration required
- Existing local storage cart/wishlist items for non-authenticated users will remain in local storage but won't sync
- Users will need to login to add new items
- The change is backward compatible - authenticated users experience no change

