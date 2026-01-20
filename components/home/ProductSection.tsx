"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { Product } from "@/lib/store";
import { dedupedFetch } from "@/lib/fetch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductSectionProps {
  title: string;
  limit?: number;
}

const TOP_STYLE_FILTERS = [
  { key: "all", label: "ALL" },
  { key: "necklaces", label: "NECKLACES" },
  { key: "bracelets", label: "BRACELETS" },
  { key: "earrings", label: "EARRINGS" },
  { key: "rings", label: "RINGS" },
  { key: "mens", label: "MENS" },
  { key: "mangalsutra", label: "MANGALSUTRA" },
] as const;

export default function ProductSection({
  title,
  limit = 4,
}: ProductSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  const [activeFilter, setActiveFilter] =
    useState<(typeof TOP_STYLE_FILTERS)[number]["key"]>("all");

  useEffect(() => {
    // Prevent duplicate calls in React Strict Mode
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchProducts = async () => {
      try {
        const data = await dedupedFetch<{ success: boolean; data: Product[] }>(
          "/api/products?limit=20"
        );
        if (data.success) {
          setProducts(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (activeFilter === "all") return products;
    const q = activeFilter.toLowerCase();
    return products.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const category = (p.category || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      return name.includes(q) || category.includes(q) || desc.includes(q);
    });
  }, [activeFilter, products]);

  return (
    <section className="py-14 bg-background">
      {/* Slightly narrower container makes the 4-up cards smaller (closer to the reference UI). */}
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-xl md:text-2xl font-semibold tracking-wide uppercase">
            {title}
          </h2>
        </motion.div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {TOP_STYLE_FILTERS.map((f) => {
            const active = f.key === activeFilter;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setActiveFilter(f.key)}
                className={cn(
                  "h-9 px-4 border border-border text-xs font-semibold uppercase tracking-wide transition",
                  active
                    ? "bg-foreground text-background"
                    : "bg-background text-foreground hover:bg-muted"
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Products */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(limit)].map((_, index) => (
              <div
                key={index}
                className="aspect-[4/5] bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No products found.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.slice(0, limit).map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}

        <div className="flex justify-center mt-10">
          <Button
            variant="outline"
            className="rounded-none px-10 uppercase tracking-wide"
            asChild
          >
            <Link href="/shop">View All</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
