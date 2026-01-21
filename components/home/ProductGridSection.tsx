"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { Product } from "@/lib/store";
import { dedupedFetch } from "@/lib/fetch";

export default function ProductGridSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in React Strict Mode
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchProducts = async () => {
      try {
        const data = await dedupedFetch<{ success: boolean; data: Product[] }>(
          "/api/products?limit=12"
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

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className="aspect-[4/5] bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-muted-foreground">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

