# Category Flow Root-Level Fix

## Problem Analysis

The category flow from admin panel to frontend had several issues:

1. **Repository Level**: Categories were filtered by `isActive` but NOT by `showInNav`, returning all active categories regardless of navigation settings
2. **Service Level**: No filtering by `showInNav` flag
3. **API Level**: No automatic filtering by `showInNav` for public requests
4. **Frontend Level**: Client-side filtering was inefficient and error-prone:
   - Navigation component only filtered root categories, not children recursively
   - Shop sidebar filtered client-side, which is inefficient
5. **Admin Panel**: Needed to ensure admins can still see all categories (including inactive and non-nav)

## Root Cause

The `showInNav` flag was being set in the admin panel but was never respected at the database/API level. All filtering was done client-side, which:
- Was inefficient (fetching all categories then filtering)
- Was error-prone (inconsistent filtering logic)
- Didn't properly handle nested category trees

## Root-Level Solution

### 1. Repository Layer (`src/domains/categories/repositories/category.repository.ts`)

**Changes:**
- Added `onlyNavCategories` parameter to `findMany()`, `findRootCategories()`, and `getCategoryTree()`
- Implemented database-level filtering by `showInNav` when `onlyNavCategories = true`
- Added recursive filtering method `filterNavCategories()` to ensure nested children are also filtered
- Updated ordering to use `navOrder` when filtering for navigation

**Key Implementation:**
```typescript
async findRootCategories(includeInactive: boolean = false, onlyNavCategories: boolean = false): Promise<Category[]> {
  // Database-level filtering by showInNav
  if (onlyNavCategories) {
    where.showInNav = true;
  }
  
  // Recursive filtering for nested children
  if (onlyNavCategories) {
    return this.filterNavCategories(rootCategories);
  }
}
```

### 2. Service Layer (`src/domains/categories/services/category.service.ts`)

**Changes:**
- Added `onlyNavCategories` parameter to `getAllCategories()`, `getRootCategories()`, and `getCategoryTree()`
- Passes the parameter through to repository methods

### 3. API Layer (`app/api/v1/categories/route.ts`)

**Changes:**
- Automatically filters by `showInNav = true` for non-admin users
- Admins see all categories by default (unless explicitly requesting `onlyNavCategories=true`)
- Non-admin users always get only navigation categories

**Key Logic:**
```typescript
const onlyNavCategories = isAdmin 
  ? (onlyNavCategoriesParam === 'true') // Admins see all by default
  : true; // Non-admins always get nav-only categories
```

### 4. Frontend - Navigation (`components/layout/Navigation.tsx`)

**Changes:**
- Removed client-side filtering by `showInNav` (backend handles it)
- Added sorting by `navOrder` for proper navigation display
- Simplified logic since backend already filters correctly

**Before:**
```typescript
const navCategories = response.data.filter((cat) => cat.showInNav);
```

**After:**
```typescript
// Backend already filters by showInNav, so use all returned categories
const sortedCategories = response.data.sort((a, b) => {
  const navOrderA = (a as any).navOrder ?? 0;
  const navOrderB = (b as any).navOrder ?? 0;
  return navOrderA - navOrderB;
});
```

### 5. Frontend - Shop Sidebar (`app/(public)/shop/page.tsx`)

**Changes:**
- Removed client-side filtering by `showInNav` (backend handles it)
- Kept tree flattening logic for sidebar display
- Backend now returns only categories with `showInNav = true`

**Before:**
```typescript
const walk = (node: ShopCategory) => {
  if (node.showInNav) {
    flat.push(node);
  }
  // ...
};
```

**After:**
```typescript
// Backend already filters by showInNav, so all returned categories should be shown
const walk = (node: ShopCategory) => {
  flat.push(node);
  // ...
};
```

### 6. Admin Panel (`components/admin/settings/CategoryManagement.tsx`)

**No Changes Required:**
- Admin panel continues to work as before
- Admins see all categories (including inactive and non-nav) by default
- This is handled by the API logic that checks `isAdmin` status

## Flow Diagram

### Before (Broken):
```
Admin Panel → API → Repository (filters by isActive only) → Service → API → Frontend
                                                                              ↓
                                                                    Client-side filter by showInNav
                                                                    (inconsistent, error-prone)
```

### After (Fixed):
```
Admin Panel → API → Repository (filters by isActive AND showInNav) → Service → API → Frontend
                                                                                      ↓
                                                                    Backend already filtered
                                                                    (consistent, efficient)
```

## Benefits

1. **Performance**: Database-level filtering is more efficient than client-side filtering
2. **Consistency**: All frontend components receive the same filtered data
3. **Correctness**: Recursive filtering ensures nested children are properly filtered
4. **Maintainability**: Single source of truth for filtering logic
5. **Security**: Non-admin users cannot see categories not marked for navigation
6. **Flexibility**: Admins can still see all categories for management purposes

## Testing Checklist

- [ ] Navigation bar shows only categories with `showInNav = true`
- [ ] Navigation bar respects `navOrder` for sorting
- [ ] Shop sidebar shows only categories with `showInNav = true`
- [ ] Nested category children are properly filtered
- [ ] Admin panel shows all categories (including inactive and non-nav)
- [ ] Categories can be toggled on/off in admin panel and changes reflect immediately
- [ ] Inactive categories are not shown to public users
- [ ] Categories without `showInNav = true` are not shown in navigation or sidebar

## Files Modified

1. `src/domains/categories/repositories/category.repository.ts` - Added `onlyNavCategories` filtering
2. `src/domains/categories/services/category.service.ts` - Added `onlyNavCategories` parameter
3. `app/api/v1/categories/route.ts` - Automatic filtering for non-admin users
4. `components/layout/Navigation.tsx` - Removed client-side filtering
5. `app/(public)/shop/page.tsx` - Removed client-side filtering

## Migration Notes

- No database migration required
- Existing categories with `showInNav = false` will now be properly hidden from frontend
- Admin panel functionality remains unchanged
- All changes are backward compatible

