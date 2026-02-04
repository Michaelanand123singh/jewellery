"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const items = [
  { label: "Necklaces", href: "/search?q=necklaces", image: "/img/product/1.jpg" },
  { label: "Rings", href: "/search?q=rings", image: "/img/product/2.jpg" },
  { label: "Earrings", href: "/search?q=earrings", image: "/img/product/3.jpg" },
  { label: "Bracelets", href: "/search?q=bracelets", image: "/img/product/4.jpg" },
  { label: "Mens", href: "/search?q=mens", image: "/img/product/5.jpg" },
  { label: "Mangalsutra", href: "/search?q=mangalsutra", image: "/img/product/6.jpg" },
] as const;

export default function EverydayDemifineSection() {
  return (
    <section className="py-10 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-wide">
            ADORNE BESTSELLERS 
          </h2>
        </motion.div>

        {/* Match screenshot layout: one left-to-right strip. On small screens, allow horizontal scroll instead of wrapping. */}
        <div className="w-full overflow-x-auto">
          <div className="grid grid-flow-col auto-cols-[minmax(180px,1fr)] sm:auto-cols-[minmax(200px,1fr)] md:grid-flow-row md:grid-cols-6 gap-2 md:gap-2">
          {items.map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.04 }}
            >
              <Link
                href={item.href}
                className="group block border border-border bg-background overflow-hidden"
              >
                <div className="relative aspect-[4/5]">
                  <Image
                    src={item.image}
                    alt={item.label}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 45vw"
                  />
                </div>
                <div className="p-2">
                  <span className="text-xs md:text-sm font-semibold uppercase tracking-wide underline underline-offset-4">
                    {item.label}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}


