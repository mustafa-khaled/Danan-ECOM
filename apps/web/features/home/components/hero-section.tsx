"use client";

import Image from "next/image";
import { ChevronsDown } from "lucide-react";
import { useTranslations } from "next-intl";

export default function HeroSection() {
  const t = useTranslations("home");

  return (
    <section className="relative overflow-hidden">
      <div className="relative h-191.5 md:h-215.5 bg-ds-surface">
        <Image
          src="/assets/dadan-model.avif"
          alt={t("aboutDadan")}
          fill
          priority
          sizes="100vw"
          className="object-cover sm:object-top object-[30%] blur-[1px] sm:scale-[1.1]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(0.17deg, #AF6149 -39.65%, rgba(65, 149, 155, 0) 84.35%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-26.75 md:bottom-30 mx-auto flex flex-col items-center px-4 text-center">
          <h1 className="font-heading rtl:font-arabic font-bold md:font-semibold text-h4 md:text-h2 leading-[120%] tracking-[-0.02em] text-white text-center">
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
            className="hero-cta-gradient mt-6 md:mt-7.75 inline-flex h-14.25 min-h-14.25 w-full max-w-89.5 sm:w-71 items-center justify-between gap-3 sm:gap-8.75 px-3.5 py-3 sm:p-3 font-body rtl:font-arabic text-lg sm:text-2xl font-semibold leading-none tracking-normal text-ds-secondary transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer"
          >
            <span className="truncate whitespace-nowrap">
              {t("exploreAllPieces")}
            </span>
            <ChevronsDown
              size={22}
              strokeWidth={2.5}
              className="text-ds-teal-700 shrink-0"
            />
          </button>
        </div>
      </div>
    </section>
  );
}
