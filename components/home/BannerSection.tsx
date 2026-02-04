"use client";

import Image from "next/image";

export default function BannerSection() {
  return (
    <section className="relative w-full min-h-[240px] sm:min-h-[240px] md:min-h-[480px] lg:min-h-[600px] overflow-hidden">
      <Image
        src="/img/hero-section-banner/1 (1).webp"
        alt="Banner"
        fill
        className="object-cover"
        priority
      />
    </section>
  );
}

