"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

const items = [
  { id: 1, image: "/img/slider/1.jpg", label: "PARTY WEAR" },
  { id: 2, image: "/img/slider/2.jpg", label: "DAY OUT" },
  { id: 3, image: "/img/slider/3.jpg", label: "DATE NIGHT" },
  { id: 4, image: "/img/slider/4.jpg", label: "WEDDING WEAR" },
  { id: 5, image: "/img/slider/5.jpg", label: "OFFICE WEAR" },
  { id: 6, image: "/img/slider/6.jpg", label: "DAILY WEAR" },
];

export default function FeaturedProducts() {
  const [active, setActive] = useState(1);
  const total = items.length;

  const prev = () => setActive((i) => (i - 1 + total) % total);
  const next = () => setActive((i) => (i + 1) % total);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative bg-white py-20 overflow-hidden">

      {/* 3D Carousel Container */}

      <div className="relative max-w-7xl mx-auto flex items-center justify-center">
        {/* LEFT ARROW */}
        <button
          onClick={prev}
          className="absolute left-6 z-30 bg-white rounded-full shadow p-2"
          aria-label="Previous"
        >
          <ChevronLeft size={30} />
        </button>

        {/* SLIDES */}
        <div
          className="relative w-full h-[520px] sm:min-h-[240px] md:min-h-[480px] lg:min-h-[600px] flex items-center justify-center"
          style={{ perspective: "1200px" }}
        >
          {items.map((item, i) => {
            const pos = (i - active + total) % total;

            let x = 0;
            let scale = 1;
            let rotateY = 0;
            let zIndex = 0;
            let opacity = 1;

            // LEFT CARD
            if (pos === 0) {
              x = -340;
              scale = 0.92;
              rotateY = 12;
              zIndex = 1;
              opacity = 0.9;
            }

            // CENTER CARD
            if (pos === 1) {
              x = 0;
              scale = 1.05;
              rotateY = 0;
              zIndex = 3;
              opacity = 1;
            }

            // RIGHT CARD
            if (pos === 2) {
              x = 340;
              scale = 0.92;
              rotateY = -12;
              zIndex = 1;
              opacity = 0.9;
            }

            // HIDE REST
            if (pos > 2) opacity = 0;

            return (
              <motion.div
                key={item.id}
                className="absolute"
                animate={{ x, scale, rotateY, opacity }}
                transition={{
                  duration: 0.8,
                  ease: [0.4, 0, 0.2, 1],
                }}
                style={{
                  zIndex,
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="relative w-[400px] h-[480px]">
                  <Image
                    src={item.image}
                    alt={item.label}
                    fill
                    className="object-cover"
                    priority={pos === 1}
                  />

                  {/* LABEL */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                    <span className="text-white text-md underline tracking-wide">
                      {item.label}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* RIGHT ARROW */}
        <button
          onClick={next}
          className="absolute right-6 z-30 bg-white rounded-full shadow p-2"
          aria-label="Next"
        >
          <ChevronRight size={30} />
        </button>
      </div>
    </section>
  );
}
