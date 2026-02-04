"use client";

import { motion } from "framer-motion";
import { Heart, Layers, Sparkles } from "lucide-react";

const confidenceFeatures = [
  {
    id: 1,
    title: "SKIN SAFE",
    icon: Heart,
    description:
      "Our jewelry is hypoallergenic and skin-safe, crafted with care to ensure comfort for all skin types. Enjoy beautiful, irritation-free wear every day, knowing each piece is designed with your well-being in mind.",
  },
  {
    id: 2,
    title: "18K GOLD PLATED",
    icon: Layers,
    description:
      "Our jewelry is crafted from premium metals like stainless steel with 18k gold plating, ensuring durability and lasting shine. Experience luxury and quality with every piece, designed to stand the test of time.",
  },
  // {
  //   id: 3,
  //   title: "AUTHENTIC DIAMONDS",
  //   icon: Sparkles,
  //   description:
  //     "Our lab-grown diamonds are SGL Certified, ensuring the highest standards of quality and authenticity same like natural diamonds. Each diamond undergoes rigorous testing to guarantee its brilliance and ethical origins. Shine with confidence in every sparkly moment.",
  // },
];

export default function ShopWithConfidence() {
  return (
    <section className="py-10 sm:py-12 md:py-14 bg-muted/30">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-medium uppercase tracking-[0.18em]">
            SHOP WITH CONFIDENCE
          </h2>
        </motion.div>

        {/* Three Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-10">
          {confidenceFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                {/* Icon */}
                <div className="flex justify-center mb-5">
                  <Icon className="h-10 w-10 text-foreground" strokeWidth={1.5} />
                </div>

                {/* Title */}
                <h3 className="text-sm sm:text-base font-medium uppercase tracking-[0.16em] mb-4">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-foreground/80 text-sm leading-relaxed max-w-sm mx-auto">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

