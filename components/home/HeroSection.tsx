"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function HeroSection() {
  const slides = useMemo(
    () => [
      "/img/hero-section-banner/1 (1).webp",
      "/img/hero-section-banner/2 (1).webp",
      "/img/hero-section-banner/3 (1).webp",
    ],
    []
  );

  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [mounted, slides.length]);

  const goPrev = () => setActive((i) => (i - 1 + slides.length) % slides.length);
  const goNext = () => setActive((i) => (i + 1) % slides.length);

  return (
    <section className="relative w-full min-h-[240px] sm:min-h-[240px] md:min-h-[480px] lg:min-h-[700px] overflow-hidden">
      {/* Carousel (no content, no gradients) */}
      <div className="absolute inset-0">
        <motion.div
          key={slides[active]}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <Image
            src={slides[active]}
            alt={`Hero slide ${active + 1}`}
            fill
            className="object-cover"
            priority={active === 0}
          />
        </motion.div>
      </div>

      {/* Controls */}
      <button
        type="button"
        aria-label="Previous slide"
        onClick={goPrev}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 rounded-ful text-white p-2 sm:p-2.5 backdrop-blur-sm transition"
      >
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={goNext}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 rounded-full text-white p-2 sm:p-2.5 backdrop-blur-sm transition"
      >
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
    </section>
  );
}