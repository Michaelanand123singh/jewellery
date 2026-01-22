"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const categories = [
  {
    name: "Women",
    href: "/shop?category=women",
    subcategories: [
      { name: "Rings", href: "/shop?category=women&subcategory=rings" },
      { name: "Necklaces", href: "/shop?category=women&subcategory=necklaces" },
      { name: "Earrings", href: "/shop?category=women&subcategory=earrings" },
      { name: "Bracelets", href: "/shop?category=women&subcategory=bracelets" },
    ],
  },
  {
    name: "Kids",
    href: "/shop?category=kids",
    subcategories: [
      { name: "Kids Rings", href: "/shop?category=kids&subcategory=rings" },
      { name: "Kids Necklaces", href: "/shop?category=kids&subcategory=necklaces" },
    ],
  },
  {
    name: "Artificial Jewellery",
    href: "/shop?category=artificial",
    subcategories: [
      { name: "Artificial Rings", href: "/shop?category=artificial&subcategory=rings" },
      { name: "Artificial Necklaces", href: "/shop?category=artificial&subcategory=necklaces" },
    ],
  },
  {
    name: "Footwear",
    href: "/shop?category=footwear",
  },
  {
    name: "Accessories",
    href: "/shop?category=accessories",
  },
];

export default function Navigation({ isOpen = false, onClose }: NavigationProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-background">
        <div className="container mx-auto px-4">
          <ul className="flex items-center justify-center gap-0.5 lg:gap-1 flex-wrap -mt-0.5">
            {categories.map((category) => (
              <li
                key={category.name}
                className="relative group"
                onMouseEnter={() => setOpenDropdown(category.name)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  href={category.href}
                  className="flex items-center gap-1 px-3 lg:px-4 py-1.5 lg:py-2.5 text-xs lg:text-sm font-medium hover:text-primary transition-colors whitespace-nowrap"
                >
                  {category.name}
                  {category.subcategories && (
                    <ChevronDown className="h-3 w-3 lg:h-4 lg:w-4" />
                  )}
                </Link>
                {category.subcategories && (
                  <div
                    className={cn(
                      "absolute top-full left-0 bg-popover border rounded-md shadow-lg min-w-[180px] lg:min-w-[200px] py-2 z-50 transition-all duration-200",
                      openDropdown === category.name
                        ? "opacity-100 visible translate-y-0"
                        : "opacity-0 invisible pointer-events-none -translate-y-2"
                    )}
                  >
                    {category.subcategories.map((sub) => (
                      <Link
                        key={sub.name}
                        href={sub.href}
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
              <div key={category.name}>
                <Link
                  href={category.href}
                  className="block px-4 py-2.5 text-sm font-medium hover:text-primary hover:bg-muted/50 rounded-md transition-colors"
                  onClick={onClose}
                >
                  {category.name}
                </Link>
                {category.subcategories && (
                  <div className="pl-4 space-y-0.5 border-l border-border ml-4">
                    {category.subcategories.map((sub) => (
                      <Link
                        key={sub.name}
                        href={sub.href}
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
