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
        <div className="absolute inset-x-0 bottom-20 mx-auto flex flex-col items-center px-4 text-center sm:bottom-30">
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
            className="hero-cta-gradient mt-6 sm:mt-8 inline-flex h-14.25 min-h-14.25 w-full max-w-89.5 sm:w-71 items-center justify-between gap-3 sm:gap-8.75 px-3.5 py-3 sm:p-3 font-body rtl:font-arabic text-lg sm:text-2xl font-semibold leading-none tracking-normal text-ds-secondary transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer"
          >
            <span className="truncate whitespace-nowrap">{t("exploreAllPieces")}</span>
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
