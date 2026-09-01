import { Container } from "@/components/ui";
import Image from "next/image";
import React from "react";

export default function LayoutHero() {
  return (
    <section className="relative w-full h-123 lg:h-106.5 overflow-hidden flex lg:items-center items-end justify-center lg:pb-0 pb-25.5">
      {/* Background Image */}
      <Image
        src="/assets/wardrobe.avif"
        alt="DADAN Collection Banner"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[0_1%]"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none z-1" />

      {/* Monotone noise effect filter */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay z-2 opacity-60"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='monotoneNoise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23monotoneNoise)'/%3E%3C/svg%3E")`,
        }}
      />

      <Container className="relative text-[#FFFFFF] z-10 text-center">
        <h1 className="font-heading lg:text-[64px] font-extrabold text-h3">
          Your Wardrobe
        </h1>
        <p className="lg:text-[32px] lg:font-semibold text-h5 font-medium lg:mt-[16px] mt-3">
          A curated collection of the pieces that are part of your story
        </p>
      </Container>
    </section>
  );
}
