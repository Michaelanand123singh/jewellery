"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Product, useCartStore, useWishlistStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { useAuthRequired } from "@/components/providers/AuthRequiredProvider";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
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

  // Extract brand from product name (first word before space) or use category
  const brand = product.name.split(' ')[0] || product.category;
  const productTitle = product.name.split(' ').slice(1).join(' ') || product.name;
  
  // Calculate discount percentage
  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  
  // Review count (use reviewCount if available, otherwise default to 0)
  const reviewCount = product.reviewCount || 0;
  
  // Check if stock is low (for "Only Few Left!" badge)
  const isLowStock = product.stockQuantity !== undefined && product.stockQuantity !== null && product.stockQuantity > 0 && product.stockQuantity < 10;
  
  // Random AD label (can be made conditional based on product properties)
  const showAdLabel = Math.random() > 0.7;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border hover:border-primary/40 rounded-none">
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          <Link href={`/products/${product.id}`} className="block w-full h-full">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.06]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            />
          </Link>
          {showAdLabel && (
            <div className="absolute top-1.5 right-1.5 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded z-10">
              AD
            </div>
          )}
          {product.originalPrice && discountPercentage > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1.5 left-1.5 bg-destructive text-destructive-foreground text-[9px] font-bold px-1.5 py-0.5 rounded z-10"
            >
              {discountPercentage}% OFF
            </motion.div>
          )}
          <motion.div
            className="absolute top-1.5 right-1.5 z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ opacity: 1, scale: 1 }}
            animate={wishlistClicked ? { scale: [1, 1.3, 1] } : {}}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-background/90 backdrop-blur-sm hover:bg-background"
              onClick={handleWishlistClick}
            >
              <Heart
                className={cn(
                  "h-3.5 w-3.5 transition-all",
                  isInWishlist && "fill-primary text-primary"
                )}
              />
            </Button>
          </motion.div>
          <motion.div
            className="absolute bottom-1.5 left-1.5 right-1.5 z-10"
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              className="w-full h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow"
              onClick={handleAddToCart}
              disabled={!product.inStock}
            >
              <ShoppingCart className="h-3 w-3 mr-1.5" />
              Add to Bag
            </Button>
          </motion.div>
        </div>
        <CardContent className="p-2.5">
          {/* Brand */}
          <div className="text-[10px] text-muted-foreground mb-0.5 font-medium uppercase">
            {brand}
          </div>
          {/* Product Title */}
          <Link href={`/products/${product.id}`}>
            <h3 className="text-xs font-medium mb-1.5 hover:text-primary transition-colors line-clamp-2 leading-tight">
              {productTitle}
            </h3>
          </Link>
          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-0.5 mb-1.5">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-2.5 w-2.5",
                      i < Math.floor(product.rating!) ? "fill-primary text-primary" : "text-muted-foreground"
                    )}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground ml-0.5">
                {product.rating.toFixed(1)} ({reviewCount})
              </span>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-2.5 pt-0 flex flex-col items-start gap-1.5">
          {/* Price */}
          <div className="flex items-baseline gap-1.5 w-full">
            <span className="text-sm font-semibold">₹{product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <>
                <span className="text-[10px] text-muted-foreground line-through">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
              </>
            )}
          </div>
          {/* Low Stock Badge */}
          {isLowStock && (
            <div className="text-[10px] text-destructive font-medium">
              Only Few Left!
            </div>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
