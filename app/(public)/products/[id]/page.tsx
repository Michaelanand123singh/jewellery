"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  Check, 
  ChevronRight, 
  X,
  ArrowRight,
  ChevronDown,
  Plus,
  Truck,
  RotateCcw,
  IndianRupee,
  Sparkles,
  ChevronLeft,
  Tag
} from "lucide-react";
import { useCartStore, useWishlistStore, Product } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ProductCard from "@/components/home/ProductCard";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthRequired } from "@/components/providers/AuthRequiredProvider";
import { EmptyState } from "@/components/ui/empty-state";
import { Package } from "lucide-react";

// Component for wishlist button in carousel
function CarouselWishlistButton({ 
  productId, 
  productName,
  onAddToWishlist 
}: { 
  productId: string; 
  productName: string;
  onAddToWishlist: () => void;
}) {
  const isInWishlist = useWishlistStore((state) => state.isInWishlist(productId));

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        onAddToWishlist();
        toast.success(`${productName} added to wishlist!`);
      }}
      className="absolute bottom-2 left-2 z-10 h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
      aria-label="Add to wishlist"
    >
      <Heart
        className={cn(
          "h-4 w-4",
          isInWishlist && "fill-primary text-primary"
        )}
      />
    </button>
  );
}

export default function ProductPage({
  params,
}: {
  // Next.js Route Segment config expects params to be a Promise in generated types.
  // `await params` also works at runtime even if Next passes a plain object.
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("6");
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    description: false,
    specification: false,
    supplier: false,
    returns: false,
  });
  const [activePromoTab, setActivePromoTab] = useState<string>("b1g1");
  // Fetch promotional products from API when tab changes
  const [promotionalProducts, setPromotionalProducts] = useState<Product[]>([]);
  const [loadingPromoProducts, setLoadingPromoProducts] = useState(false);
  
  // Available sizes for jewelry (US sizes)
  const availableSizes = ["6", "7", "8"];
  const addToCart = useCartStore((state) => state.addItem);
  const addToWishlist = useWishlistStore((state) => state.addItem);
  const { requireAuth } = useAuthRequired();
  // Must call hook unconditionally - use empty string as default if product not loaded yet
  const isInWishlist = useWishlistStore((state) =>
    state.isInWishlist(product?.id || "")
  );
  const hasFetched = useRef<string | null>(null);
  const currentProductIdRef = useRef<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [carouselScrollPosition, setCarouselScrollPosition] = useState(0);

  useEffect(() => {
    // Immediately reset states when params change (synchronous)
    // This prevents 404 flash by ensuring loading state is set before async operations
    setLoading(true);
    setNotFound(false);

    const fetchProduct = async () => {
      try {
        const { id: productId } = await params;

        // If navigating to a different product, clear old data
        if (
          currentProductIdRef.current !== null &&
          currentProductIdRef.current !== productId
        ) {
          setProduct(null);
          setRelatedProducts([]);
          hasFetched.current = null;
          setLoading(true); // Ensure loading state when switching products
        }

        // Validate productId
        if (!productId) {
          setNotFound(true);
          setLoading(false);
          currentProductIdRef.current = productId || null;
          return;
        }

        // Track current product and proceed with fetch
        // dedupedFetch will handle request deduplication at the network level
        if (hasFetched.current !== productId) {
          hasFetched.current = productId;
        }
        currentProductIdRef.current = productId;

        const productResponse = await apiClient.get<any>(`/products/${productId}`);

        if (productResponse.success && productResponse.data) {
          setProduct(productResponse.data);
          
          // Extract reviews from product response if available
          if (productResponse.data.reviews && Array.isArray(productResponse.data.reviews)) {
            setReviews(productResponse.data.reviews);
          }

          // Fetch related products from same category
          const category = productResponse.data.category || "women";
          const relatedResponse = await apiClient.get<Product[]>("/products", {
            category,
            limit: 10,
          });

          if (relatedResponse.success && relatedResponse.data) {
            const filtered = relatedResponse.data.filter(
              (p: Product) => p.id !== productId
            );
            setRelatedProducts(filtered.slice(0, 8));
          }

          // Fetch reviews separately if not in product response
          const productData = productResponse.data as any;
          if (!productData.reviews) {
            setReviewsLoading(true);
            try {
              const reviewsResponse = await apiClient.get(`/reviews?productId=${productId}`);
              if (reviewsResponse.success && reviewsResponse.data) {
                const reviewsData = (reviewsResponse.data as any).reviews || reviewsResponse.data;
                setReviews(Array.isArray(reviewsData) ? reviewsData : []);
              }
            } catch (error) {
              console.error("Failed to fetch reviews:", error);
            } finally {
              setReviewsLoading(false);
            }
          } else {
            setReviewsLoading(false);
          }
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params]);

  // Fetch promotional products from API when tab changes
  useEffect(() => {
    const fetchPromotionalProducts = async () => {
      if (!product) return;
      
      setLoadingPromoProducts(true);
      try {
        // Fetch products with discounts (on sale) for promotional tabs
        // You can filter by tags, featured status, or onSale in the future
        const promoResponse = await apiClient.get<Product[]>("/products", {
          limit: 10,
          // Filter products that have originalPrice (on sale)
          // This ensures we show products with discounts
        });

        if (promoResponse.success && promoResponse.data) {
          // Filter products that are on sale (have originalPrice)
          const onSaleProducts = promoResponse.data.filter(
            (p: Product) => p.originalPrice && p.originalPrice > p.price
          );
          
          // If we have on-sale products, use them; otherwise use all products
          const productsToShow = onSaleProducts.length > 0 
            ? onSaleProducts.slice(0, 8)
            : promoResponse.data.slice(0, 8);
          
          setPromotionalProducts(productsToShow);
        }
      } catch (error) {
        console.error("Failed to fetch promotional products:", error);
        // Fallback to related products if promo fetch fails
        setPromotionalProducts(relatedProducts);
      } finally {
        setLoadingPromoProducts(false);
      }
    };

    fetchPromotionalProducts();
  }, [activePromoTab, product, relatedProducts]);

  // Show loading state while fetching
  if (loading) {
    return (
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-12">
            <div className="aspect-square bg-gradient-to-br from-muted via-muted/50 to-muted animate-pulse rounded-2xl" />
            <div className="space-y-6">
              <div className="h-10 bg-muted animate-pulse rounded-lg w-3/4" />
            <div className="h-6 bg-muted animate-pulse rounded w-1/2" />
              <div className="h-16 bg-muted animate-pulse rounded-lg w-full" />
              <div className="h-32 bg-muted animate-pulse rounded-lg w-full" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Show 404 only after loading completes and product doesn't exist
  if (!loading && (notFound || !product)) {
    return (
      <main className="flex-grow container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-4">Product Not Found</h2>
          <p className="text-muted-foreground mb-8">
            The product you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push("/shop")}>Back to Shop</Button>
        </div>
      </main>
    );
  }

  // TypeScript guard: product should exist at this point
  if (!product) {
    return null; // Should never reach here, but TypeScript needs this
  }

  const images = product.images || [product.image];

  const handleAddToCart = async () => {
    if (!product) return;
    
    const isAuthenticated = await requireAuth("cart", product, quantity);
    if (!isAuthenticated) return;
    
    setIsAddingToCart(true);
    try {
      await addToCart(product, quantity);
      toast.success(`${product.name} added to cart!`, {
        description: `Quantity: ${quantity}`,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to add to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    const isAuthenticated = await requireAuth("cart", product, quantity);
    if (!isAuthenticated) return;
    
    try {
      await addToCart(product, quantity);
      router.push("/checkout");
    } catch (error: any) {
      toast.error(error.message || "Failed to proceed to checkout");
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleAddToWishlist = async () => {
    if (!product) return;
    
    if (isInWishlist) {
      toast.info(`${product.name} is already in your wishlist`);
      return;
    }
    
    const isAuthenticated = await requireAuth("wishlist", product);
    if (isAuthenticated) {
      try {
        await addToWishlist(product);
        toast.success(`${product.name} added to wishlist!`);
      } catch (error: any) {
        toast.error(error.message || "Failed to add to wishlist");
      }
    }
  };

  const calculateDiscount = () => {
    if (product.originalPrice && product.originalPrice > product.price) {
      return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    }
    return 0;
  };

  // Mock promotional offers (can be fetched from API later)
  const promotionalOffers = [
    {
      text: "Buy 3 at 3003 Use Code: MEGA3 at checkout.",
      code: "MEGA3"
    },
    {
      text: "Buy 4 at 3996 Use Code: MEGA4 at checkout.",
      code: "MEGA4"
    },
    {
      text: "Buy 1 Get 1 Free Use Code: B1G1 at checkout.",
      code: "B1G1"
    }
  ];

  // Get products to display - prioritize promotional products, fallback to related products
  const displayProducts = promotionalProducts.length > 0 
    ? promotionalProducts 
    : relatedProducts;

  return (
    <main className="flex-grow bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-12 mb-8 sm:mb-12">
          {/* Image Gallery - Left Side */}
          <div className="relative">
            {/* Main Image */}
            <div className="relative aspect-square overflow-hidden bg-muted rounded-lg mb-4">
              <Image
                src={images[selectedImage] || product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              
              {/* Buy 1 Get 1 Badge - Top Left */}
              <div className="absolute top-4 left-4 z-10">
                <div className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded shadow-lg">
                  Buy 1 Get 1
            </div>
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                      "aspect-square relative overflow-hidden rounded border-2 transition-all",
                    selectedImage === index
                      ? "border-primary"
                        : "border-transparent hover:border-muted-foreground/50"
                  )}
                >
                  <Image
                    src={img}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 25vw, 12.5vw"
                  />
                </button>
              ))}
            </div>
            )}
          </div>

          {/* Product Info - Right Side */}
          <div className="space-y-4">
            {/* Product Title and Rating - Same Line */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight flex-1">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                        "h-3 w-3 sm:h-4 sm:w-4",
                      i < Math.floor(product.rating || 0)
                        ? "fill-primary text-primary"
                          : "text-muted fill-muted"
                    )}
                  />
                ))}
              </div>
                <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                  ({product.reviewCount || 0})
              </span>
              </div>
            </div>

            {/* Price Section */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl font-bold">₹{product.price.toLocaleString()}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                <>
                    <span className="text-lg sm:text-xl text-muted-foreground line-through">
                      ₹{product.originalPrice.toLocaleString()}
                  </span>
                    <span className="text-xs sm:text-sm bg-black text-white dark:bg-black dark:text-white px-2 sm:px-2.5 py-0.5 sm:py-1 font-semibold">
                      SAVE {calculateDiscount()}%
                  </span>
                </>
              )}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Inclusive of all taxes
              </div>
            </div>

            {/* SKU */}
            <div className="text-sm text-muted-foreground">
              SKU: {product.slug ? product.slug.toUpperCase() : product.id.slice(0, 8).toUpperCase()}
            </div>

            {/* Promotional Offers */}
            <div className="space-y-2 border-t border-b border-border py-4">
              {promotionalOffers.map((offer, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Tag className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{offer.text}</span>
                </div>
              ))}
              <div className="text-xs text-muted-foreground pl-7">
                Note: You need to add minimum 2 products to avail this discount.
              </div>
              <button className="text-sm text-primary hover:underline pl-7 font-medium">
                See All Offers
              </button>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600 dark:text-green-500" />
              <span className="text-sm font-medium text-green-600 dark:text-green-500">
                In stock - ready to ship
                  </span>
            </div>

            {/* Size Selection */}
            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs sm:text-sm font-semibold block">
                SIZE (US): {selectedSize}
              </label>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 flex items-center justify-center font-medium text-xs sm:text-sm transition-all",
                      selectedSize === size
                        ? "border-amber-600 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                        : "border-border hover:border-primary/50 text-foreground bg-background"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 sm:space-y-3 pt-2">
              <Button
                size="lg"
                className="w-full h-11 sm:h-12 bg-gray-900 dark:bg-gray-800 text-white hover:bg-gray-800 dark:hover:bg-gray-700 font-semibold text-sm sm:text-base"
                onClick={handleAddToCart}
                disabled={!product.inStock || isAddingToCart}
              >
                {isAddingToCart ? (
                  "Adding..."
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    ADD TO CART
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                  </>
                )}
              </Button>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 h-11 sm:h-12 border-2 text-sm sm:text-base"
                  onClick={handleBuyNow}
                disabled={!product.inStock}
              >
                  BUY IT NOW
              </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 w-11 sm:h-12 sm:w-12 border-2 p-0"
                  onClick={handleAddToWishlist}
                  aria-label="Add to wishlist"
                >
                <Heart
                  className={cn(
                      "h-4 w-4 sm:h-5 sm:w-5",
                    isInWishlist && "fill-primary text-primary"
                  )}
                />
              </Button>
              </div>
            </div>

            {/* Collapsible Sections */}
            <div className="space-y-0 border-t border-border pt-4">
              {/* Description Section */}
              <div className="border-b border-border bg-muted/30">
                <button
                  onClick={() => toggleSection("description")}
                  className="w-full flex items-center justify-between py-3 px-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-semibold">Description</span>
                  <div className="h-8 w-8 rounded bg-foreground text-background flex items-center justify-center">
                    <Plus className={cn(
                      "h-4 w-4 transition-transform",
                      expandedSections.description && "rotate-45"
                    )} />
          </div>
                </button>
                {expandedSections.description && (
                  <div className="pb-4 px-4 text-sm text-muted-foreground leading-relaxed">
                    {product.description || "This exquisite jewelry piece features fine craftsmanship and premium materials, designed to be treasured for generations."}
                  </div>
                )}
        </div>

              {/* Specification Section */}
              <div className="border-b border-border bg-muted/30">
                <button
                  onClick={() => toggleSection("specification")}
                  className="w-full flex items-center justify-between py-3 px-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-semibold">Specification</span>
                  <div className="h-8 w-8 rounded bg-foreground text-background flex items-center justify-center">
                    <Plus className={cn(
                      "h-4 w-4 transition-transform",
                      expandedSections.specification && "rotate-45"
                    )} />
                  </div>
                </button>
                {expandedSections.specification && (
                  <div className="pb-4 px-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Material:</span>
                      <span className="font-medium">Gold/Silver</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Weight:</span>
                      <span className="font-medium">Custom</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Style:</span>
                      <span className="font-medium">Classic</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Finish:</span>
                      <span className="font-medium">Polished</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium capitalize">{product.category}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Supplier Information Section */}
              <div className="border-b border-border bg-muted/30">
                <button
                  onClick={() => toggleSection("supplier")}
                  className="w-full flex items-center justify-between py-3 px-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-semibold">Supplier Information</span>
                  <div className="h-8 w-8 rounded bg-foreground text-background flex items-center justify-center">
                    <Plus className={cn(
                      "h-4 w-4 transition-transform",
                      expandedSections.supplier && "rotate-45"
                    )} />
                  </div>
                </button>
                {expandedSections.supplier && (
                  <div className="pb-4 px-4 text-sm text-muted-foreground leading-relaxed space-y-2">
                    <p>Our jewelry is sourced from trusted suppliers who meet our strict quality standards.</p>
                    <div className="space-y-1">
                      <p><span className="font-medium">Supplier Name:</span> Premium Jewelry Co.</p>
                      <p><span className="font-medium">Location:</span> Mumbai, India</p>
                      <p><span className="font-medium">Certification:</span> ISO 9001:2015 Certified</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Returns Section */}
              <div className="bg-muted/30">
                <button
                  onClick={() => toggleSection("returns")}
                  className="w-full flex items-center justify-between py-3 px-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-semibold">Returns</span>
                  <div className="h-8 w-8 rounded bg-foreground text-background flex items-center justify-center">
                    <Plus className={cn(
                      "h-4 w-4 transition-transform",
                      expandedSections.returns && "rotate-45"
                    )} />
                  </div>
                </button>
                {expandedSections.returns && (
                  <div className="pb-4 px-4 text-sm text-muted-foreground leading-relaxed space-y-2">
                    <p>We offer hassle-free returns and exchanges for your peace of mind.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>2 Days Return Policy</li>
                      <li>10 Days Exchange Policy</li>
                      <li>Items must be in original condition with tags attached</li>
                      <li>Free return shipping for defective items</li>
                </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Key Features/Trust Badges Section */}
        <div className="bg-amber-50 dark:bg-amber-950/20 py-6 sm:py-8 px-4 sm:px-6 rounded-lg mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {/* Free Shipping */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-amber-700 dark:text-amber-400" />
              </div>
                  <div>
                <h3 className="font-semibold text-sm sm:text-base text-foreground">Free Shipping</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">On orders above ₹500</p>
              </div>
            </div>

            {/* Skin Safe Jewellery */}
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <div className="relative">
                  <div className="h-6 w-6 rounded-full border-2 border-amber-700 dark:border-amber-400"></div>
                  <Sparkles className="h-3 w-3 text-amber-700 dark:text-amber-400 absolute -top-1 -right-1" />
                </div>
                  </div>
                  <div>
                <h3 className="font-semibold text-foreground">Skin Safe Jewellery</h3>
                <p className="text-sm text-muted-foreground">Hypoallergenic materials</p>
              </div>
            </div>

            {/* 18k Gold Tone Plated */}
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="h-2 w-4 bg-amber-700 dark:bg-amber-400 rounded"></div>
                  <div className="h-2 w-4 bg-amber-700 dark:bg-amber-400 rounded"></div>
                  <div className="h-2 w-4 bg-amber-700 dark:bg-amber-400 rounded"></div>
                  <Sparkles className="h-2 w-2 text-amber-700 dark:text-amber-400" />
                </div>
                  </div>
                  <div>
                <h3 className="font-semibold text-foreground">18k Gold Tone Plated</h3>
                <p className="text-sm text-muted-foreground">Premium quality finish</p>
                  </div>
            </div>
          </div>
        </div>

        {/* Delivery and Service Information */}
        <div className="space-y-6 mb-12">
          {/* Estimated Delivery Date */}
          <div className="flex items-center justify-between py-4 border-b border-border">
            <span className="font-semibold">Estimated Delivery Date</span>
            <button className="text-amber-700 dark:text-amber-400 underline font-medium hover:text-amber-800 dark:hover:text-amber-300 transition-colors">
              CHECK PINCODE
            </button>
          </div>

          {/* Service Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* 2 Days Return */}
            <div className="bg-background border-2 border-border rounded-lg p-4 sm:p-6 text-center">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <RotateCcw className="h-6 w-6 sm:h-8 sm:w-8 text-foreground" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">2 Days Return</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Easy returns within 2 days of delivery
              </p>
            </div>

            {/* 10 Days Exchange */}
            <div className="bg-background border-2 border-border rounded-lg p-4 sm:p-6 text-center">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <RotateCcw className="h-6 w-6 sm:h-8 sm:w-8 text-foreground" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">10 Days Exchange</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Exchange for different size or style
              </p>
            </div>

            {/* Cash On Delivery */}
            <div className="bg-background border-2 border-border rounded-lg p-4 sm:p-6 text-center">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Cash On Delivery</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Pay when you receive your order
              </p>
            </div>
          </div>
        </div>


        {/* Promotional Tabs */}
        <div className="bg-white border-b border-border py-3 sm:py-4 mb-6 sm:mb-8 overflow-x-auto">
          <div className="flex flex-wrap items-center justify-start gap-3 sm:gap-4 md:gap-8 min-w-max">
            <button
              onClick={() => setActivePromoTab("b1g1")}
              className={cn(
                "text-sm sm:text-base md:text-lg lg:text-xl font-bold transition-colors pb-2 border-b-2 whitespace-nowrap",
                activePromoTab === "b1g1"
                  ? "border-primary text-primary"
                  : "border-transparent text-foreground hover:text-primary"
              )}
            >
              Buy 1 Get 1 Free
            </button>
            <button
              onClick={() => setActivePromoTab("b3")}
              className={cn(
                "text-xs sm:text-sm md:text-base font-semibold transition-colors pb-2 border-b-2 whitespace-nowrap",
                activePromoTab === "b3"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-primary"
              )}
            >
              Buy 3 At 3003
            </button>
            <button
              onClick={() => setActivePromoTab("b4")}
              className={cn(
                "text-xs sm:text-sm md:text-base font-semibold transition-colors pb-2 border-b-2 whitespace-nowrap",
                activePromoTab === "b4"
                  ? "border-primary text-primary underline"
                  : "border-transparent text-muted-foreground hover:text-primary underline"
              )}
            >
              Buy 4 At ₹3996
            </button>
          </div>
        </div>

        {/* Related Products Carousel */}
        <section className="mb-12">
          {/* Carousel Container */}
          <div className="relative">
            {/* Left Arrow */}
            {displayProducts.length > 0 && (
              <button
                onClick={() => {
                  if (carouselRef.current) {
                    const scrollAmount = carouselRef.current.clientWidth;
                    carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                  }
                }}
                className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-background border-2 border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}

            {/* Scrollable Carousel */}
            {displayProducts.length > 0 ? (
              <div
                ref={carouselRef}
                className="overflow-x-auto scrollbar-hide scroll-smooth"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
                onScroll={(e) => setCarouselScrollPosition(e.currentTarget.scrollLeft)}
              >
                <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
                  {displayProducts.map((relatedProduct) => (
                    <div
                      key={relatedProduct.id}
                      className="flex-shrink-0 w-[240px] sm:w-[280px] md:w-[300px] group"
                    >
                      <div className="relative bg-white border border-border rounded-lg overflow-hidden">
                        {/* Product Image */}
                        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                          <Link href={`/products/${relatedProduct.id}`} className="block w-full h-full">
                            <Image
                              src={relatedProduct.image}
                              alt={relatedProduct.name}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                              sizes="(max-width: 640px) 280px, 300px"
                            />
                          </Link>

                          {/* BUY 1 GET 1 Badge - Top Right */}
                          <div className="absolute top-2 right-2 z-10">
                            <div className="bg-amber-50 dark:bg-amber-950/30 text-black dark:text-amber-200 text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                              BUY 1 GET 1
                            </div>
                          </div>

                          {/* Heart Icon - Bottom Left */}
                          <CarouselWishlistButton 
                            productId={relatedProduct.id} 
                            productName={relatedProduct.name}
                            onAddToWishlist={() => addToWishlist(relatedProduct)} 
                          />

                          {/* ADD TO BAG Button - Bottom Right */}
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              try {
                                await addToCart(relatedProduct);
                                toast.success(`${relatedProduct.name} added to cart!`);
                              } catch (error: any) {
                                toast.error(error.message || 'Failed to add to cart');
                              }
                            }}
                            className="absolute bottom-2 right-2 z-10 bg-amber-50 dark:bg-amber-950/30 text-black dark:text-amber-200 text-xs font-semibold px-3 py-1.5 rounded shadow-sm hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
                            disabled={!relatedProduct.inStock}
                          >
                            ADD TO BAG
                          </button>
                        </div>

                        {/* Product Info */}
                        <div className="p-4 text-center">
                          <Link href={`/products/${relatedProduct.id}`}>
                            <h3 className="text-sm font-medium mb-2 hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
                              {relatedProduct.name}
                            </h3>
                          </Link>
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-base font-semibold">₹{relatedProduct.price.toLocaleString()}</span>
                            {relatedProduct.originalPrice && (
                              <span className="text-sm text-muted-foreground line-through">
                                ₹{relatedProduct.originalPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No products available for this offer.</p>
              </div>
            )}

            {/* Right Arrow */}
            {displayProducts.length > 0 && (
              <button
                onClick={() => {
                  if (carouselRef.current) {
                    const scrollAmount = carouselRef.current.clientWidth;
                    carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                  }
                }}
                className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-background border-2 border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
          </div>

          {/* Hide scrollbar for webkit browsers */}
          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </section>

        {/* Similar/Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-8">
                  <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Similar Products</h2>
                <p className="text-muted-foreground">
                  Discover more exquisite pieces from our collection
                </p>
                  </div>
                </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </section>
        )}

        {/* Reviews Section */}
        <section className="mb-12">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Customer Reviews</h2>
            <p className="text-muted-foreground">
              See what our customers are saying about this product
            </p>
          </div>

          {reviewsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-4 text-muted-foreground">Loading reviews...</p>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-6">
              {/* Overall Rating Summary */}
              <Card className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="text-center md:text-left">
                    <div className="text-5xl font-bold mb-2">
                      {product.rating?.toFixed(1) || "0.0"}
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-5 w-5",
                            i < Math.floor(product.rating || 0)
                              ? "fill-primary text-primary"
                              : "text-muted fill-muted"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                    </p>
                  </div>

                  {/* Rating Distribution */}
                  <div className="flex-1 max-w-md space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = reviews.filter((r: any) => r.rating === rating).length;
                      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <div className="flex items-center gap-1 w-20">
                            <span className="text-sm font-medium w-4">{rating}</span>
                            <Star className="h-4 w-4 fill-primary text-primary" />
                          </div>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
            </Card>

              {/* Reviews List */}
                  <div className="space-y-4">
                {reviews.map((review: any) => (
                  <Card key={review.id} className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-semibold text-primary">
                            {(review.user?.name || review.user?.email || "A")[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {review.user?.name || "Anonymous"}
                            </span>
                            {review.verified && (
                              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded">
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "h-4 w-4",
                                  i < review.rating
                                      ? "fill-primary text-primary"
                                    : "text-muted fill-muted"
                                  )}
                                />
                              ))}
                            </div>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(review.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                              </span>
                          </div>
                          {review.comment && (
                      <p className="text-sm text-foreground leading-relaxed pl-15">
                              {review.comment}
                            </p>
                          )}
                  </Card>
                ))}
                        </div>
                  </div>
                ) : (
            <Card className="p-12 text-center">
              <Star className="h-12 w-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to review this product and help others make their decision.
                  </p>
              <Button variant="outline" onClick={() => router.push("/login")}>
                Write a Review
              </Button>
            </Card>
          )}
        </section>
      </div>

      {/* Image Banner Section - Full Width */}
      <section className="w-full mb-12">
        <div className="relative w-full overflow-hidden">
          <div className="relative aspect-[16/6] md:aspect-[16/5] w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700">
            <Image
              src="/img/slider/3.jpg"
              alt="Special Offer Banner"
              fill
              className="object-cover"
              sizes="100vw"
              priority={false}
              onError={(e) => {
                // Hide image on error, gradient background will show
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            {/* Overlay content */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="text-center px-4 max-w-3xl">
                <h3 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                  Exclusive Collection
                </h3>
                <p className="text-base md:text-lg lg:text-xl text-white/95 mb-4 drop-shadow-md">
                  Discover our premium jewelry pieces crafted with perfection
                </p>
                <Button
                  size="lg"
                  className="bg-white text-amber-700 hover:bg-amber-50 font-semibold shadow-lg"
                  onClick={() => router.push('/shop')}
                >
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
            </div>
          </section>

      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsFullscreen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-7xl max-h-[90vh] w-full h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm hover:bg-background z-10"
                onClick={() => setIsFullscreen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={images[selectedImage] || product.image}
                  alt={product.name}
                  fill
                  className="object-contain"
                  sizes="90vw"
                />
              </div>
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={cn(
                        "h-2 w-2 rounded-full transition-all",
                        selectedImage === index
                          ? "bg-white w-8"
                          : "bg-white/50 hover:bg-white/75"
                      )}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
