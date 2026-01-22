"use client";

import Image from "next/image";

export default function PromotionalBanner() {
  return (
    <section className="relative w-full min-h-[500px] sm:min-h-[600px] md:min-h-[700px] overflow-hidden">
      <Image
        src="/img/hero-section-banner/4 (1).webp"
        alt="Promotional Banner"
        fill
        className="object-cover"
        priority
      />
    </section>
  );
}
