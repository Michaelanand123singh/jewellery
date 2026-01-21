"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

const featuredItems = [
  {
    id: 1,
    image: "/img/slider/1.jpg",
    label: "DAILY WEAR",
  },
  {
    id: 2,
    image: "/img/slider/2.jpg",
    label: "OFFICE WEAR",
  },
  {
    id: 3,
    image: "/img/slider/3.jpg",
    label: "PARTY WEAR",
  },
];

export default function FeaturedProducts() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [mounted]);

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredItems.length) % featuredItems.length);
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
  };

  if (!mounted) return null;

  // Calculate transform for horizontal scrolling
  const translateX = -(currentIndex * (100 / featuredItems.length));

  return (
    <section className="relative w-full overflow-hidden bg-background py-12 sm:py-16 md:py-20">
      <div className="w-full">
        {/* 3D Carousel Container */}
        <div className="relative" style={{ perspective: "1200px" }}>
          {/* Left Arrow */}
          <button
            type="button"
            aria-label="Previous slide"
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 rounded-full bg-black/40 hover:bg-black/60 text-white p-3 backdrop-blur-sm transition-all shadow-lg"
          >
            <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
          </button>

          {/* Horizontal Scrolling Carousel - Full Width */}
          <div className="relative h-[400px] sm:h-[450px] md:h-[500px] overflow-hidden px-16 sm:px-20 md:px-24">
            <motion.div
              className="flex h-full gap-4 sm:gap-6 md:gap-8"
              animate={{
                x: `${translateX}%`,
              }}
              transition={{
                duration: 0.8,
                ease: "easeInOut",
              }}
              style={{
                width: `${featuredItems.length * 100}%`,
              }}
            >
              {featuredItems.map((item, index) => {
                const position = index - currentIndex;
                const isActive = position === 0;
                const isLeft = position < 0;
                const isRight = position > 0;

                // Calculate 3D transform based on position
                let rotateY = 0;
                let translateZ = 0;
                let opacity = 0.6;
                let scale = 0.85;

                if (isActive) {
                  rotateY = 0;
                  translateZ = 0;
                  opacity = 1;
                  scale = 1;
                } else if (isLeft) {
                  rotateY = 20;
                  translateZ = -150;
                  opacity = 0.5;
                  scale = 0.8;
                } else if (isRight) {
                  rotateY = -20;
                  translateZ = -150;
                  opacity = 0.5;
                  scale = 0.8;
                }

                return (
                  <motion.div
                    key={item.id}
                    className="flex-shrink-0 h-full"
                    style={{
                      width: `${100 / featuredItems.length}%`,
                      transformStyle: "preserve-3d",
                      transform: `rotateY(${rotateY}deg) translateZ(${translateZ}px) scale(${scale})`,
                      opacity,
                    }}
                    transition={{
                      duration: 0.8,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="relative w-full h-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
                      <div className="relative aspect-[3/4] sm:aspect-[2/3] md:aspect-[3/4] w-full h-full shadow-2xl">
                        <Image
                          src={item.image}
                          alt={item.label}
                          fill
                          className="object-cover rounded-lg"
                          priority={isActive}
                        />
                        {/* Text Overlay at Bottom */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4 sm:p-5 md:p-6 rounded-b-lg">
                          <h3 className="text-white text-lg sm:text-xl md:text-2xl font-semibold uppercase tracking-wide">
                            {item.label}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Right Arrow */}
          <button
            type="button"
            aria-label="Next slide"
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 rounded-full bg-black/40 hover:bg-black/60 text-white p-3 backdrop-blur-sm transition-all shadow-lg"
          >
            <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {featuredItems.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-black w-8"
                    : "bg-black/40 hover:bg-black/60 w-2"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
