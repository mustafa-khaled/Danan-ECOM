"use client";

import Image from "next/image";
import { ChevronsDown } from "lucide-react";
import { useTranslations } from "next-intl";

export default function HeroSection() {
  const t = useTranslations("home");

  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[calc(100dvh-78px)] md:h-[calc(100dvh-115px)] bg-ds-surface">
        <Image
          src="/assets/dadan-model.avif"
          alt={t("aboutDadan")}
          fill
          priority
          sizes="100vw"
          className="object-cover sm:object-top object-[30%]"
        />
        <div className="hero-overlay-gradient absolute inset-0" />
        <div className="absolute inset-x-0 bottom-20 mx-auto flex flex-col items-center px-2 text-center sm:bottom-30">
          <h1 className="font-heading rtl:font-arabic text-2xl font-semibold text-white sm:text-3xl">
            {t.rich("heroTitle", {
              bm: () => <br className="sm:hidden" />,
              bd: () => <br className="hidden sm:inline" />,
            })}
          </h1>
          <button
            onClick={() => {
              const nextSection = document.querySelector(
                "section:nth-of-type(2)",
              );
              nextSection?.scrollIntoView({ behavior: "smooth" });
            }}
            className="hero-cta-gradient w-[85%] sm:w-auto mt-6 inline-flex items-center justify-between gap-2 px-6 py-2.5 font-body rtl:font-arabic text-sm font-medium tracking-wide text-ds-secondary transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer sm:mt-8"
          >
            {t("exploreAllPieces")}
            <ChevronsDown
              size={16}
              strokeWidth={2.5}
              className="text-ds-teal-700"
            />
          </button>
        </div>
      </div>
    </section>
  );
}
