"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

type Testimonial = {
  name: string;
  location: string;
  quote: string;
  rating: number;
};

const testimonials: Testimonial[] = [
  {
    name: "Aarohi",
    location: "Mumbai",
    rating: 5,
    quote:
      "The finish looks premium and the pieces feel so light. I’ve been wearing them daily and they still look brand new.",
  },
  {
    name: "Meera",
    location: "Bengaluru",
    rating: 5,
    quote:
      "Packaging was elegant, delivery was quick, and the detailing is beautiful. Instantly upgraded my everyday look.",
  },
  {
    name: "Riya",
    location: "Delhi",
    rating: 5,
    quote:
      "Super skin-friendly and the shine is just perfect—subtle but classy. Got compliments the first day I wore it.",
  },
];

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const initials = parts.map((p) => p[0]?.toUpperCase()).join("");
  return (
    <div className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold tracking-wide">
      {initials || "U"}
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section className="py-12 sm:py-14 bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-medium uppercase tracking-[0.18em]">
            Testimonials
          </h2>
          <p className="mt-3 text-sm text-foreground/70 max-w-2xl mx-auto">
            Loved by customers for comfort, quality, and everyday elegance.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((t, idx) => (
            <motion.article
              key={t.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              className="bg-background border border-border rounded-none shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Initials name={t.name} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold tracking-wide truncate">
                        {t.name}
                      </div>
                      <div className="text-xs text-foreground/60 truncate">
                        {t.location}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={[
                          "h-4 w-4",
                          i < t.rating
                            ? "fill-foreground text-foreground"
                            : "text-foreground/20",
                        ].join(" ")}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-5 text-sm leading-relaxed text-foreground/80">
                  “{t.quote}”
                </div>

                <div className="mt-6 h-px bg-border" />

                <div className="mt-4 text-xs uppercase tracking-[0.18em] text-foreground/60">
                  Verified Purchase
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}


