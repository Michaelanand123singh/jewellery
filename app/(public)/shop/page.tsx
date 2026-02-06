"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/home/ProductCard";
import ProductListItem from "@/components/home/ProductListItem";
import { Product } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Grid,
  List,
  X,
  ChevronRight,
  Home,
  Filter,
  Star,
  SlidersHorizontal,
  Search,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCardSkeleton } from "@/components/ui/loading-skeleton";
import { Package } from "lucide-react";

// Category type used for shop sidebar (from /api/v1/categories?tree=true)
interface ShopCategory {
  id: string;
  name: string;
  slug: string;
  showInNav?: boolean;
  children?: ShopCategory[];
}

// Category mapping from URL to display names
const categoryMap: Record<string, string> = {
  women: "Women",
  kids: "Kids",
  artificial: "Artificial Jewellery",
  footwear: "Footwear",
  accessories: "Accessories",
};

const subcategoryMap: Record<string, string> = {
  rings: "Rings",
  necklaces: "Necklaces",
  earrings: "Earrings",
  bracelets: "Bracelets",
};

function ShopPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL state
  const category = searchParams.get("category") || "";
  const subcategory = searchParams.get("subcategory") || "";
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const minPrice = searchParams.get("minPrice") ? parseInt(searchParams.get("minPrice")!) : null;
  const maxPrice = searchParams.get("maxPrice") ? parseInt(searchParams.get("maxPrice")!) : null;
  const rating = searchParams.get("rating") ? parseFloat(searchParams.get("rating")!) : null;
  const inStock = searchParams.get("inStock") === "true";
  const onSale = searchParams.get("onSale") === "true";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 12;

  // Local state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [filterInStock, setFilterInStock] = useState(false);
  const [filterOnSale, setFilterOnSale] = useState(false);
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarCategories, setSidebarCategories] = useState<ShopCategory[]>([]);

  // Update URL params helper
  const updateURL = (updates: Record<string, string | number | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "" || value === 0) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    
    // Reset to page 1 when filters change (except when page itself changes)
    if (!updates.page) {
      params.delete("page");
    }
    
    router.push(`/shop?${params.toString()}`);
  };

  // Fetch products function (memoized with useCallback)
  const fetchProducts = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const params: Record<string, string | number> = {};
      if (category) params.category = category;
      if (search) params.search = search;
      if (minPrice !== null) params.minPrice = minPrice;
      if (maxPrice !== null) params.maxPrice = maxPrice;
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;
      params.page = page;
      params.limit = limit;

      const response = await apiClient.get<Product[]>("/products", params);
      
      if (response.success && response.data) {
        setProducts(response.data);
        setTotalPages(response.meta?.totalPages || 1);
        setTotalProducts(response.meta?.total || 0);
        
        // Set max price range based on all products
        if (response.data.length > 0) {
          const maxPrice = Math.max(...response.data.map((p: Product) => p.price));
          setPriceRange((prev) => [prev[0], Math.max(prev[1] || 10000, maxPrice)]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      if (showRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [category, search, minPrice, maxPrice, sortBy, sortOrder, page, limit]);

  // Fetch products on mount and when filters change
  useEffect(() => {
    fetchProducts();
    
    // Refresh products when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchProducts(true);
      }
    };
    
    // Refresh on window focus
    const handleFocus = () => {
      fetchProducts(true);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchProducts]);

  // Fetch all products for filters (refresh on page focus/visibility change)
  const fetchAllProducts = async () => {
    try {
      const response = await apiClient.get<Product[]>("/products", { limit: 1000 });
      if (response.success && response.data) {
        setAllProducts(response.data);
        const maxPrice = Math.max(...response.data.map((p: Product) => p.price));
        setPriceRange([0, Math.max(10000, maxPrice)]);
      }
    } catch (error) {
      console.error("Failed to fetch all products:", error);
    }
  };

  useEffect(() => {
    fetchAllProducts();
    
    // Refresh when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAllProducts();
      }
    };
    
    // Refresh on window focus
    const handleFocus = () => {
      fetchAllProducts();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Fetch categories for sidebar
  useEffect(() => {
    const fetchSidebarCategories = async () => {
      try {
        const response = await apiClient.get<ShopCategory[]>("/categories", { tree: "true" });
        
        if (response.success && response.data && Array.isArray(response.data)) {
          const flat: ShopCategory[] = [];

          // Flatten the tree structure for sidebar display
          const walk = (node: ShopCategory) => {
            flat.push(node);
            if (node.children && node.children.length > 0) {
              node.children.forEach(walk);
            }
          };

          response.data.forEach(walk);
          setSidebarCategories(flat);
        } else {
          setSidebarCategories([]);
        }
      } catch (error) {
        console.error("Failed to fetch sidebar categories:", error);
        setSidebarCategories([]);
      }
    };

    fetchSidebarCategories();
  }, []);

  // Manual refresh handler
  const handleRefresh = async () => {
    await Promise.all([fetchProducts(true), fetchAllProducts()]);
  };

  // Sync local state with URL params
  useEffect(() => {
    if (category) {
      setSelectedCategories([category]);
    } else {
      setSelectedCategories([]);
    }
    setSelectedRating(rating);
    setFilterInStock(inStock);
    setFilterOnSale(onSale);
    if (minPrice !== null || maxPrice !== null) {
      setPriceRange([
        minPrice !== null ? minPrice : 0,
        maxPrice !== null ? maxPrice : priceRange[1],
      ]);
    }
  }, [category, rating, inStock, onSale, minPrice, maxPrice]);

  // Get sidebar categories (admin-managed) with product counts
  const availableCategories = useMemo(() => {
    // Count products per category slug
    const categoryCounts = allProducts.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Map admin-managed sidebar categories to { slug, label, count }
    const list = sidebarCategories.map((cat) => ({
      slug: cat.slug,
      label: cat.name,
      count: categoryCounts[cat.slug] || 0,
    }));

    // Sort by count (desc) to keep most popular at top
    return list.sort((a, b) => b.count - a.count);
  }, [allProducts, sidebarCategories]);

  // Map of sidebar category slug to display name for quick lookup
  const sidebarCategoryLabels = useMemo(() => {
    const map: Record<string, string> = {};
    sidebarCategories.forEach((cat) => {
      map[cat.slug] = cat.name;
    });
    return map;
  }, [sidebarCategories]);

  // Gender options
  const genderOptions = ["Men", "Women", "Boys", "Girls"];

  // Filter products based on all criteria
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Subcategory filter (client-side as API doesn't support it)
    if (subcategory) {
      // This is a simplified filter - you may need to adjust based on your data structure
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(subcategory.toLowerCase()) ||
        p.category.toLowerCase().includes(subcategory.toLowerCase())
      );
    }

    // Category filter (if multiple selected)
    if (selectedCategories.length > 0 && !category) {
      filtered = filtered.filter((p) => selectedCategories.includes(p.category));
    }

    // Price range filter
    if (priceRange[0] > 0 || priceRange[1] < 10000) {
      filtered = filtered.filter(
        (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
      );
    }

    // Rating filter
    if (selectedRating !== null) {
      filtered = filtered.filter(
        (p) => p.rating && p.rating >= selectedRating
      );
    }

    // In stock filter
    if (filterInStock) {
      filtered = filtered.filter((p) => p.inStock);
    }

    // On sale filter
    if (filterOnSale) {
      filtered = filtered.filter((p) => p.originalPrice && p.originalPrice > p.price);
    }

    return filtered;
  }, [products, subcategory, selectedCategories, category, priceRange, selectedRating, filterInStock, filterOnSale]);

  // Active filters for display
  const activeFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string; value: string }> = [];
    
    if (category) {
      filters.push({ key: "category", label: "Category", value: categoryMap[category] || category });
    }
    if (subcategory) {
      filters.push({ key: "subcategory", label: "Subcategory", value: subcategoryMap[subcategory] || subcategory });
    }
    if (search) {
      filters.push({ key: "search", label: "Search", value: search });
    }
    if (minPrice !== null || maxPrice !== null) {
      filters.push({
        key: "price",
        label: "Price",
        value: `₹${minPrice !== null ? minPrice : 0} - ₹${maxPrice !== null ? maxPrice : "∞"}`,
      });
    }
    if (rating !== null) {
      filters.push({ key: "rating", label: "Rating", value: `${rating}+ stars` });
    }
    if (inStock) {
      filters.push({ key: "inStock", label: "In Stock", value: "Yes" });
    }
    if (onSale) {
      filters.push({ key: "onSale", label: "On Sale", value: "Yes" });
    }
    
    return filters;
  }, [category, subcategory, search, minPrice, maxPrice, rating, inStock, onSale]);

  const removeFilter = (key: string) => {
    if (key === "category") {
      updateURL({ category: null, subcategory: null });
    } else if (key === "subcategory") {
      updateURL({ subcategory: null });
    } else if (key === "search") {
      updateURL({ search: null });
    } else if (key === "price") {
      updateURL({ minPrice: null, maxPrice: null });
      setPriceRange([0, priceRange[1]]);
    } else if (key === "rating") {
      updateURL({ rating: null });
    } else if (key === "inStock") {
      updateURL({ inStock: null });
    } else if (key === "onSale") {
      updateURL({ onSale: null });
    }
  };

  const clearAllFilters = () => {
    router.push("/shop");
    setPriceRange([0, priceRange[1]]);
    setSelectedCategories([]);
    setSelectedRating(null);
    setFilterInStock(false);
    setFilterOnSale(false);
  };

  const handlePriceRangeChange = (newRange: number[]) => {
    setPriceRange(newRange);
    updateURL({
      minPrice: newRange[0] > 0 ? newRange[0] : null,
      maxPrice: newRange[1] < priceRange[1] ? newRange[1] : null,
    });
  };

  const toggleCategory = (cat: string) => {
    const newCategories = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    setSelectedCategories(newCategories);
    updateURL({ category: newCategories.length === 1 ? newCategories[0] : null });
  };

  const handleRatingChange = (rating: number | null) => {
    setSelectedRating(rating);
    updateURL({ rating });
  };

  const handleInStockChange = (checked: boolean) => {
    setFilterInStock(checked);
    updateURL({ inStock: checked ? "true" : null });
  };

  const handleOnSaleChange = (checked: boolean) => {
    setFilterOnSale(checked);
    updateURL({ onSale: checked ? "true" : null });
  };

  // Breadcrumbs
  const breadcrumbItems = [
    { label: "Shop", href: "/shop" },
    ...(category ? [{ label: categoryMap[category] || category, href: undefined }] : []),
  ];

  const pageTitle = category 
    ? `${categoryMap[category] || category} - ${totalProducts.toLocaleString()} items`
    : subcategory 
    ? `${subcategoryMap[subcategory] || subcategory} - ${totalProducts.toLocaleString()} items`
    : `Jewellery - ${totalProducts.toLocaleString()} items`;

  return (
    <main className="flex-grow">
        <div className="bg-background border-b">
          <div className="container mx-auto px-4 py-3">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 md:py-8">
          <PageHeader
            title={pageTitle}
            description="Discover our exquisite collection of fine jewelry"
          />

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="mb-4 sm:mb-6 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <span className="font-medium whitespace-nowrap">Active Filters:</span>
              {activeFilters.map((filter) => (
                <div
                  key={filter.key}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-primary/10 text-primary rounded-full text-xs sm:text-sm"
                >
                  <span className="font-medium hidden sm:inline">{filter.label}:</span>
                  <span className="truncate max-w-[120px] sm:max-w-none">{filter.value}</span>
                  <button
                    onClick={() => removeFilter(filter.key)}
                    className="ml-1 hover:bg-primary/20 rounded-full p-0.5 flex-shrink-0"
                    aria-label={`Remove ${filter.label} filter`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs sm:text-sm whitespace-nowrap"
              >
                Clear All
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 sm:gap-4 lg:gap-6">
            {/* Sidebar Filters */}
            <aside className="lg:col-span-1">
              {/* Mobile Filter Toggle */}
              <div className="lg:hidden mb-4">
                <Button
                  variant="outline"
                  className="w-full justify-between text-sm"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {activeFilters.length > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                        {activeFilters.length}
                      </span>
                    )}
                  </span>
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              <div
                className={cn(
                  "space-y-5 lg:sticky lg:top-24 max-h-[calc(100vh-150px)] overflow-y-auto lg:max-h-none pr-2",
                  showMobileFilters ? "block" : "hidden lg:block"
                )}
              >
                {/* FILTERS Heading */}
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wide mb-3">FILTERS</h2>
                  
                  {/* Gender Filter */}
                  <div className="mb-5">
                    <RadioGroup
                      value={selectedGender}
                      onValueChange={(value) => {
                        setSelectedGender(value);
                        // You can add gender filtering logic here
                      }}
                    >
                      <div className="space-y-2">
                        {genderOptions.map((gender) => (
                          <div key={gender} className="flex items-center space-x-2">
                            <RadioGroupItem value={gender.toLowerCase()} id={`gender-${gender.toLowerCase()}`} className="h-3.5 w-3.5" />
                            <Label
                              htmlFor={`gender-${gender.toLowerCase()}`}
                              className="text-xs font-normal cursor-pointer"
                            >
                              {gender}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* CATEGORIES Heading */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold uppercase tracking-wide">CATEGORIES</h2>
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  
                  <div className="space-y-2.5 max-h-96 overflow-y-auto">
                    {(showMoreCategories ? availableCategories : availableCategories.slice(0, 8)).map(({ slug, count }) => (
                      <div key={slug} className="flex items-center space-x-2">
                        <Checkbox
                          id={slug}
                          checked={selectedCategories.includes(slug) || category === slug}
                          onCheckedChange={() => toggleCategory(slug)}
                          className="h-3.5 w-3.5"
                        />
                        <label
                          htmlFor={slug}
                          className="text-xs font-normal leading-none cursor-pointer flex-1 flex items-center justify-between"
                        >
                          <span className="capitalize">
                            {sidebarCategoryLabels[slug] || slug.replace(/-/g, " ")}
                          </span>
                          <span className="text-muted-foreground ml-2 text-[10px]">({count.toLocaleString()})</span>
                        </label>
                      </div>
                    ))}
                    {availableCategories.length > 8 && (
                      <button
                        onClick={() => setShowMoreCategories(!showMoreCategories)}
                        className="text-xs text-primary hover:underline mt-2"
                      >
                        {showMoreCategories ? "Show Less" : `+ ${availableCategories.length - 8} more`}
                      </button>
                    )}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div className="border-t pt-5">
                  <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide">Price Range</h3>
                  <Slider
                    value={priceRange}
                    onValueChange={handlePriceRangeChange}
                    max={priceRange[1] > 0 ? priceRange[1] : 10000}
                    min={0}
                    step={100}
                    className="mb-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>₹{priceRange[0].toLocaleString()}</span>
                    <span>₹{priceRange[1].toLocaleString()}</span>
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="border-t pt-5">
                  <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide">Rating</h3>
                  <div className="space-y-2">
                    {[4, 3, 2, 1].map((r) => (
                      <div key={r} className="flex items-center space-x-2">
                        <Checkbox
                          id={`rating-${r}`}
                          checked={selectedRating === r}
                          onCheckedChange={(checked) =>
                            handleRatingChange(checked ? r : null)
                          }
                          className="h-3.5 w-3.5"
                        />
                        <label
                          htmlFor={`rating-${r}`}
                          className="text-xs font-normal leading-none cursor-pointer flex items-center gap-1"
                        >
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-2.5 w-2.5",
                                i < r ? "fill-primary text-primary" : "text-muted-foreground"
                              )}
                            />
                          ))}
                          <span className="ml-1 text-[10px]">& Up</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Filters */}
                <div className="border-t pt-5 space-y-2.5">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inStock"
                      checked={filterInStock}
                      onCheckedChange={handleInStockChange}
                      className="h-3.5 w-3.5"
                    />
                    <label
                      htmlFor="inStock"
                      className="text-xs font-normal leading-none cursor-pointer"
                    >
                      In Stock Only
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="onSale"
                      checked={filterOnSale}
                      onCheckedChange={handleOnSaleChange}
                      className="h-3.5 w-3.5"
                    />
                    <label
                      htmlFor="onSale"
                      className="text-xs font-normal leading-none cursor-pointer"
                    >
                      On Sale
                    </label>
                  </div>
                </div>
              </div>
            </aside>

            {/* Products Section */}
            <div className="lg:col-span-5">
              {/* Top Filter Bar */}
              <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[130px] text-xs">
                    <SelectValue placeholder="Bundles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Bundles</SelectItem>
                    <SelectItem value="combo">Combo Offers</SelectItem>
                    <SelectItem value="set">Sets</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select defaultValue="all">
                  <SelectTrigger className="w-[150px] text-xs">
                    <SelectValue placeholder="Country of Origin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    <SelectItem value="india">India</SelectItem>
                    <SelectItem value="usa">USA</SelectItem>
                    <SelectItem value="uk">UK</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select defaultValue="all">
                  <SelectTrigger className="w-[110px] text-xs">
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sizes</SelectItem>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex-1"></div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing || loading}
                    className="h-8 px-3 text-xs"
                    aria-label="Refresh products"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", (refreshing || loading) && "animate-spin")} />
                    Refresh
                  </Button>
                  <div className="flex items-center gap-1 border rounded-md p-1">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="h-8 w-8 p-0"
                      aria-label="Grid view"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="h-8 w-8 p-0"
                      aria-label="List view"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                  <Select
                    value={`${sortBy}-${sortOrder}`}
                    onValueChange={(value) => {
                      const [newSortBy, newSortOrder] = value.split("-");
                      updateURL({ sortBy: newSortBy, sortOrder: newSortOrder });
                    }}
                  >
                    <SelectTrigger className="w-[160px] text-xs">
                      <SelectValue placeholder="Sort by: Recommended" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt-desc">Recommended</SelectItem>
                      <SelectItem value="createdAt-asc">Newest First</SelectItem>
                      <SelectItem value="price-asc">Price: Low to High</SelectItem>
                      <SelectItem value="price-desc">Price: High to Low</SelectItem>
                      <SelectItem value="name-asc">Name: A to Z</SelectItem>
                      <SelectItem value="name-desc">Name: Z to A</SelectItem>
                      <SelectItem value="rating-desc">Rating: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Products Grid/List */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No products found"
                  description="Try adjusting your filters or search terms to find what you're looking for."
                  action={{
                    label: "Clear Filters",
                    onClick: clearAllFilters,
                  }}
                />
              ) : (
                <>
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4"
                        : "space-y-4"
                    }
                  >
                    {filteredProducts.map((product) =>
                      viewMode === "grid" ? (
                        <ProductCard key={product.id} product={product} />
                      ) : (
                        <ProductListItem key={product.id} product={product} />
                      )
                    )}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 sm:mt-8 flex flex-wrap justify-center items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateURL({ page: page - 1 })}
                        disabled={page === 1}
                        className="text-xs sm:text-sm"
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={page === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateURL({ page: pageNum })}
                              className="w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateURL({ page: page + 1 })}
                        disabled={page === totalPages}
                        className="text-xs sm:text-sm"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted w-1/3 rounded"></div>
          <div className="h-4 bg-muted w-1/2 rounded"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
            <div className="lg:col-span-1 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    }>
      <ShopPageContent />
    </Suspense>
  );
}
