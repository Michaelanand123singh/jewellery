"use client";

import Image from "next/image";

export default function BannerSection() {
  return (
    <section className="relative w-full min-h-[400px] sm:min-h-[500px] md:min-h-[600px] overflow-hidden">
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

