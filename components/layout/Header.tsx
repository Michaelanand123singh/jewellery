"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Heart, ShoppingCart, Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navigation from "./Navigation";
import { useCartStore, useAuthStore } from "@/lib/store";
import { Product } from "@/lib/store";
import { apiClient } from "@/lib/api-client";

export default function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const itemCount = useCartStore((state) => state.getItemCount());
  const { user, checkAuth, logout } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    // Check auth once on mount (checkAuth has internal guards against duplicate calls)
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await apiClient.get<Product[]>("/products", {
            search: searchQuery,
            limit: 5,
          });
          
          if (response.success && response.data) {
            setSearchResults(response.data);
            setShowSearchResults(true);
          } else {
            setSearchResults([]);
            setShowSearchResults(false);
          }
        } catch (error) {
          console.error("Search failed:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchResults(false);
      setSearchQuery("");
    }
  };

  const handleProductClick = (productId: string) => {
    router.push(`/products/${productId}`);
    setShowSearchResults(false);
    setSearchQuery("");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background backdrop-blur supports-[backdrop-filter]:bg-background">
      {/* Top Bar */}
      <div className="hidden md:block bg-white">
        <div className="container mx-auto px-4 py-1.5">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-2 lg:gap-0 text-xs lg:text-sm">
            <p className="text-muted-foreground text-center lg:text-left">
              FREE SHIPPING ON ORDERS OVER ₹499
            </p>
            <div className="flex items-center gap-3 lg:gap-4 flex-wrap justify-center lg:justify-end">
              {user ? (
                <>
                  <span className="text-muted-foreground truncate max-w-[150px] lg:max-w-none">
                    Welcome, {user.name || user.email?.split('@')[0] || 'User'}
                  </span>
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="text-primary hover:text-primary/80 font-semibold whitespace-nowrap"
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/account"
                    className="text-muted-foreground hover:text-primary whitespace-nowrap"
                  >
                    Account
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-primary whitespace-nowrap"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-muted-foreground hover:text-primary whitespace-nowrap"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="text-muted-foreground hover:text-primary whitespace-nowrap"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16 gap-3 md:gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden flex items-center justify-center"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </Button>

          

          {/* Search Bar - Desktop */}
          <div className="hidden relative md:flex items-center h-14 md:h-16">
            <div ref={searchContainerRef} className="relative w-full">
              <form onSubmit={handleSearchSubmit}>
                <Input
                  type="text"
                  placeholder="Search products..."
                  className="pr-10 text-sm lg:text-base rounded-full border-border/60 hover:border-border focus-visible:border-primary/50 focus-visible:ring-primary/20 transition-all duration-200 shadow-sm hover:shadow-md focus-visible:shadow-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowSearchResults(true);
                    }
                  }}
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </form>

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 max-h-[80vh] md:max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="p-2 border-b bg-muted/30">
                        <p className="text-xs md:text-sm text-muted-foreground px-2">
                          {searchResults.length} result
                          {searchResults.length !== 1 ? "s" : ""} found
                        </p>
                      </div>
                      <div className="p-2">
                        {searchResults.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => handleProductClick(product.id)}
                            className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-md hover:bg-muted cursor-pointer transition-colors"
                          >
                            <div className="relative w-12 h-12 md:w-16 md:h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 48px, 64px"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs md:text-sm truncate">
                                {product.name}
                              </p>
                              <p className="text-xs md:text-sm text-muted-foreground">
                                ₹{product.price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {searchQuery.trim() && (
                        <div className="p-2 border-t bg-muted/20">
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-xs md:text-sm"
                            onClick={() => {
                              router.push(
                                `/search?q=${encodeURIComponent(
                                  searchQuery.trim()
                                )}`
                              );
                              setShowSearchResults(false);
                            }}
                          >
                            <Search className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                            <span className="truncate">View all results for "{searchQuery}"</span>
                          </Button>
                        </div>
                      )}
                    </>
                  ) : searchQuery.trim().length >= 2 ? (
                    <div className="p-4 md:p-6 text-center text-muted-foreground text-sm">
                      No products found
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Logo */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center">
            <Image
              src="/img/logo-adronx.webp"
              alt="Adorné"
              width={300}
              height={100}
              priority
              className="h-14 sm:h-16 md:h-[72px] lg:h-24 w-auto object-contain"
            />
          </Link>

          {/* Right Icons */}
          <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9" asChild>
              <Link href="/wishlist" aria-label="Wishlist">
                <Heart className="h-4 w-4 md:h-4 md:w-4" />
              </Link>
            </Button>

            <Button variant="ghost" size="icon" className="relative h-8 w-8 md:h-9 md:w-9" asChild>
              <Link href="/cart" aria-label="Shopping Cart">
                <ShoppingCart className="h-4 w-4 md:h-4 md:w-4" />
                {mounted && itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 h-4 w-4 md:h-4 md:w-4 rounded-full bg-primary text-primary-foreground text-[10px] md:text-[10px] flex items-center justify-center font-bold ring-2 ring-background">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Link>
            </Button>

            <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9" asChild>
              <Link href={user ? "/account" : "/login"} aria-label={user ? "Account" : "Login"}>
                <User className="h-4 w-4 md:h-4 md:w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative" ref={searchContainerRef}>
              <Input
                type="text"
                placeholder="Search products..."
                className="pr-10 text-sm rounded-full border-border/60 hover:border-border focus-visible:border-primary/50 focus-visible:ring-primary/20 transition-all duration-200 shadow-sm hover:shadow-md focus-visible:shadow-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchResults(true);
                }}
              />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                aria-label="Search"
              >
                <Search className="h-4 w-4 text-muted-foreground" />
              </Button>
              {/* Mobile Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 max-h-[60vh] overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="p-2 border-b bg-muted/30">
                        <p className="text-xs text-muted-foreground px-2">
                          {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} found
                        </p>
                      </div>
                      <div className="p-2">
                        {searchResults.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => handleProductClick(product.id)}
                            className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                          >
                            <div className="relative w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs truncate">
                                {product.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ₹{product.price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {searchQuery.trim() && (
                        <div className="p-2 border-t bg-muted/20">
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-xs"
                            onClick={() => {
                              router.push(
                                `/search?q=${encodeURIComponent(
                                  searchQuery.trim()
                                )}`
                              );
                              setShowSearchResults(false);
                            }}
                          >
                            <Search className="h-3 w-3 mr-2" />
                            <span className="truncate">View all results</span>
                          </Button>
                        </div>
                      )}
                    </>
                  ) : searchQuery.trim().length >= 2 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No products found
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Navigation */}
      <Navigation isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </header>
  );
}
