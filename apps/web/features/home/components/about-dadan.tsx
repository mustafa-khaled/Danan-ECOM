"use client";

import Container from "@/components/ui/container";
import { ArrowLink } from "@/components/ui/ArrowLink";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function AboutDadan() {
  const t = useTranslations("home");

  return (
    <section className="bg-[#F6EFED] py-10 md:py-16">
      <Container>
        {/* Title + Subtitle — full width, top */}
        <h2 className="font-english text-xl md:text-3xl font-bold tracking-tight text-(--color-text)">
          {t("aboutDadan")}
        </h2>
        <p className="mt-1 md:mt-2 text-xs md:text-sm text-(--color-text-muted) italic">
          {t("aboutSubtitle")}
        </p>

        {/* Mobile CTA — full width, shown only on mobile */}
        <div className="mt-4 md:hidden">
          <ArrowLink href="/beta/our-story" variant="primary" size="md" fullWidth>
            {t("exploreTheHouse")}
          </ArrowLink>
        </div>

        {/* Content below title — paragraph + image right-aligned on desktop */}
        <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
          {/* Left — CTA at bottom, only visible on desktop */}
          <div className="hidden md:flex flex-col justify-end">
            <ArrowLink href="/beta/our-story" variant="primary" size="sm">
              {t("exploreTheHouse")}
            </ArrowLink>
          </div>

          {/* Right — description + image */}
          <div className="flex flex-col gap-4 md:gap-6">
            <p className="text-xs md:text-sm leading-relaxed text-(--color-text-muted)">
              {t("aboutFullDescription")}
            </p>

            <div className="relative aspect-4/5 w-full overflow-hidden">
              <Image
                src="/assets/about-dadan.png"
                alt={t("aboutDadan")}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
