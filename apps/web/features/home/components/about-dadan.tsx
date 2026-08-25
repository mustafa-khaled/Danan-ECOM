"use client";

import Container from "@/components/ui/container";
import { ArrowLink } from "@/components/ui/ArrowLink";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function AboutDadan() {
  const t = useTranslations("home");

  return (
    <section className="bg-ds-surface-rose py-10 md:py-16">
      <Container>
        {/* Title + Subtitle — full width, top */}
        <div className="flex flex-col gap-2 md:gap-3">
          <h2 className="font-heading text-2xl md:text-3xl lg:text-h2 font-bold leading-tight tracking-[-0.02em] text-ds-text">
            {t("aboutDadan")}
          </h2>
          <p className="text-base md:text-xl lg:text-2xl 2xl:text-[32px] font-semibold leading-snug md:leading-normal tracking-normal text-ds-text-secondary font-body">
            {t("aboutSubtitle")}
          </p>
        </div>

        {/* Mobile CTA — full width, shown only on mobile */}
        <div className="mt-4 md:hidden">
          <ArrowLink
            href="/beta/our-story"
            variant="primary"
            size="md"
            fullWidth
          >
            {t("exploreTheHouse")}
          </ArrowLink>
        </div>

        {/* Content below title — paragraph + image right-aligned on desktop */}
        <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-[1fr_1076px] gap-6 md:gap-12">
          {/* Left — CTA at bottom, only visible on desktop */}
          <div className="hidden md:flex flex-col justify-end">
            <ArrowLink
              href="/beta/our-story"
              variant="primary"
              size="md"
              className="w-74 justify-between! text-h4! text-black"
            >
              {t("exploreTheHouse")}
            </ArrowLink>
          </div>

          {/* Right — description + image */}
          <div className="flex flex-col gap-4 md:gap-6 w-full 2xl:w-269">
            <p className="text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-[32px] font-semibold leading-relaxed md:leading-[130%] tracking-normal text-ds-text-secondary font-body">
              {t("aboutFullDescription")}
            </p>

            <div className="relative aspect-358/481 md:aspect-[1076/676.66] w-full overflow-hidden">
              <Image
                src="/assets/about-dadan.avif"
                alt={t("aboutDadan")}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 1076px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
