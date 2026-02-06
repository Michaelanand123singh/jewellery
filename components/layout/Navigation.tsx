"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

interface NavigationProps {
  isOpen?: boolean;
  onClose?: () => void;
}

// Category type shared with v1 categories API
interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  showInNav: boolean;
  children?: CategoryNode[];
}

export default function Navigation({ isOpen = false, onClose }: NavigationProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryNode[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get<CategoryNode[]>("/categories", { tree: "true" });
        
        if (response.success && response.data && Array.isArray(response.data)) {
          // Sort by navOrder (categories with showInNav=true will have navOrder set)
          // Categories without navOrder will default to 0 and appear first
          const sortedCategories = response.data.sort((a, b) => {
            const navOrderA = (a as any).navOrder ?? 999;
            const navOrderB = (b as any).navOrder ?? 999;
            return navOrderA - navOrderB;
          });
          
          setCategories(sortedCategories);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("Failed to load navigation categories:", error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-background">
        <div className="container mx-auto px-4">
          <ul className="flex items-center justify-center gap-0.5 lg:gap-1 flex-wrap -mt-0.5">
            {categories.map((category) => (
              <li
                key={category.id}
                className="relative group"
                onMouseEnter={() => setOpenDropdown(category.id)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  href={`/shop?category=${encodeURIComponent(category.slug)}`}
                  className="flex items-center gap-1 px-3 lg:px-4 py-1.5 lg:py-2.5 text-xs lg:text-sm font-medium hover:text-primary transition-colors whitespace-nowrap"
                >
                  {category.name}
                  {category.children && category.children.length > 0 && (
                    <ChevronDown className="h-3 w-3 lg:h-4 lg:w-4" />
                  )}
                </Link>
                {category.children && category.children.length > 0 && (
                  <div
                    className={cn(
                      "absolute top-full left-0 bg-popover border rounded-md shadow-lg min-w-[180px] lg:min-w-[200px] py-2 z-50 transition-all duration-200",
                      openDropdown === category.id
                        ? "opacity-100 visible translate-y-0"
                        : "opacity-0 invisible pointer-events-none -translate-y-2"
                    )}
                  >
                    {category.children.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/shop?category=${encodeURIComponent(sub.slug)}`}
                        className="block px-4 py-2 text-xs lg:text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={onClose}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
            <li>
              <Link
                href="/contact"
                className="block px-3 lg:px-4 py-1.5 lg:py-2.5 text-xs lg:text-sm font-medium hover:text-primary transition-colors whitespace-nowrap"
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isOpen && (
        <nav className="md:hidden bg-background max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="container mx-auto px-4 py-3 space-y-1">
            {categories.map((category) => (
              <div key={category.id}>
                <Link
                  href={`/shop?category=${encodeURIComponent(category.slug)}`}
                  className="block px-4 py-2.5 text-sm font-medium hover:text-primary hover:bg-muted/50 rounded-md transition-colors"
                  onClick={onClose}
                >
                  {category.name}
                </Link>
                {category.children && category.children.length > 0 && (
                  <div className="pl-4 space-y-0.5 border-l border-border ml-4">
                    {category.children.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/shop?category=${encodeURIComponent(sub.slug)}`}
                        className="block px-4 py-2 text-xs text-muted-foreground hover:text-primary hover:bg-muted/30 rounded-md transition-colors"
                        onClick={onClose}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link
              href="/contact"
              className="block px-4 py-2.5 text-sm font-medium hover:text-primary hover:bg-muted/50 rounded-md transition-colors"
              onClick={onClose}
            >
              Contact
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
