"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function HeroSection() {
  const slides = useMemo(
    () => [
      "/img/slider/1.jpg",
      "/img/slider/2.jpg",
      "/img/slider/3.jpg",
      "/img/slider/4.jpg",
      "/img/slider/5.jpg",
      "/img/slider/6.jpg",
      "/img/slider/7.jpg",
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
    <section className="relative w-full h-[600px] md:h-[700px] overflow-hidden">
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
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/30 hover:bg-black/45 text-white p-2 backdrop-blur-sm transition"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={goNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/30 hover:bg-black/45 text-white p-2 backdrop-blur-sm transition"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`Go to slide ${idx + 1}`}
            onClick={() => setActive(idx)}
            className={[
              "h-2.5 w-2.5 rounded-full transition",
              idx === active ? "bg-white" : "bg-white/40 hover:bg-white/60",
            ].join(" ")}
          />
        ))}
      </div>
    </section>
  );
}