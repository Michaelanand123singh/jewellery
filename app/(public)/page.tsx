import HeroSection from "@/components/home/HeroSection";
import EverydayDemifineSection from "@/components/home/EverydayDemifineSection";
import ProductSection from "@/components/home/ProductSection";
import PromotionalBanner from "@/components/home/PromotionalBanner";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import BannerSection from "@/components/home/BannerSection";
import ProductGridSection from "@/components/home/ProductGridSection";
import BlogSection from "@/components/home/BlogSection";
import ShopWithConfidence from "@/components/home/ShopWithConfidence";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import Newsletter from "@/components/home/Newsletter";

export default function Home() {
  return (
    <main className="flex-grow">
      <HeroSection />
      <EverydayDemifineSection />
      <ProductSection title="Adorne Your Way!" />
      <PromotionalBanner />
      <FeaturedProducts />
      <BannerSection />
      <ProductGridSection />
      <BlogSection />
      <ShopWithConfidence />
      <TestimonialsSection />
      <Newsletter />
    </main>
  );
}

