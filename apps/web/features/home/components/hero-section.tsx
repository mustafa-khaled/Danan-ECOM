"use client";

import Image from "next/image";
import { ChevronsDown } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[calc(100dvh-6rem)] bg-(--color-surface)">
        <Image
          src="/assets/dadan-model.png"
          alt="DADAN"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="hero-overlay-gradient absolute inset-0" />
        <div className="absolute inset-x-0 bottom-20 mx-auto flex flex-col items-center px-4 text-center sm:bottom-30">
          <h2 className="font-english text-2xl font-semibold text-white sm:text-3xl max-w-225">
            Discover stories, collections, and pieces curated <br /> exclusively
            for you within the House of <br /> DADAN.
          </h2>
          <button
            onClick={() => {
              const nextSection = document.querySelector(
                "section:nth-of-type(2)",
              );
              nextSection?.scrollIntoView({ behavior: "smooth" });
            }}
            className="hero-cta-gradient mt-6 inline-flex items-center gap-2 px-6 py-2.5 font-manrope text-sm font-medium tracking-wide text-[#2C2C2C] transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer sm:mt-8"
          >
            Explore All Pieces
            <ChevronsDown
              size={16}
              strokeWidth={2.5}
              className="text-[#41959B]"
            />
          </button>
        </div>
      </div>
    </section>
  );
}
