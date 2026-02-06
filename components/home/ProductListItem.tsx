"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Product, useCartStore, useWishlistStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { useAuthRequired } from "@/components/providers/AuthRequiredProvider";

interface ProductListItemProps {
  product: Product;
}

export default function ProductListItem({ product }: ProductListItemProps) {
  const addToCart = useCartStore((state) => state.addItem);
  const addToWishlist = useWishlistStore((state) => state.addItem);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist(product.id));
  const [wishlistClicked, setWishlistClicked] = useState(false);
  const { requireAuth } = useAuthRequired();

  const handleWishlistClick = async () => {
    const isAuthenticated = await requireAuth("wishlist", product);
    if (isAuthenticated) {
      try {
        await addToWishlist(product);
        setWishlistClicked(true);
        setTimeout(() => setWishlistClicked(false), 500);
      } catch (error: any) {
        toast.error(error.message || 'Failed to add to wishlist');
      }
    }
  };

  const handleAddToCart = async () => {
    const isAuthenticated = await requireAuth("cart", product);
    if (isAuthenticated) {
      try {
        await addToCart(product);
        toast.success(`${product.name} added to cart!`);
      } catch (error: any) {
        toast.error(error.message || 'Failed to add to cart');
      }
    }
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border hover:border-primary/40 rounded-none">
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="relative w-full sm:w-48 md:w-64 aspect-square sm:aspect-auto overflow-hidden bg-muted flex-shrink-0">
            <Link href={`/products/${product.id}`} className="block w-full h-full">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-[1.06]"
                sizes="(max-width: 640px) 100vw, 256px"
              />
            </Link>
            {product.originalPrice && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-1 rounded z-10"
              >
                SALE
              </motion.div>
            )}
            <motion.div
              className="absolute top-2 right-2 z-10"
              initial={{ opacity: 0, scale: 0.8 }}
              whileHover={{ opacity: 1, scale: 1 }}
              animate={wishlistClicked ? { scale: [1, 1.3, 1] } : {}}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-background/90 backdrop-blur-sm hover:bg-background"
                onClick={handleWishlistClick}
              >
                <Heart
                  className={cn(
                    "h-4 w-4 transition-all",
                    isInWishlist && "fill-primary text-primary"
                  )}
                />
              </Button>
            </motion.div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col p-4 sm:p-6">
            <div className="flex-1">
              <Link href={`/products/${product.id}`}>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 hover:text-primary transition-colors">
                  {product.name}
                </h3>
              </Link>
              
              {product.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {product.description}
                </p>
              )}

              {product.rating && (
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < Math.floor(product.rating!) ? "fill-primary text-primary" : "text-muted"
                      )}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-1">
                    ({product.rating})
                  </span>
                </div>
              )}

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-xl sm:text-2xl font-bold">₹{product.price}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{product.originalPrice}
                    </span>
                    <span className="text-sm text-destructive font-semibold">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 mt-auto">
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Bag
              </Button>
              <Button
                variant="outline"
                className="sm:w-auto"
                onClick={() => window.location.href = `/products/${product.id}`}
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

