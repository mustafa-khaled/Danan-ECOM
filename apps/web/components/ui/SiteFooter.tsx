"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import Container from "./container";

export function SiteFooter() {
  const t = useTranslations("footer");

  const exploreColumn = {
    title: t("explore"),
    links: [
      { href: "/beta/home", label: t("stories") },
      { href: "/beta/collections", label: t("collections") },
      { href: "/beta/profile/wardrobe", label: t("myCollection") },
    ],
  };

  const houseColumn = {
    title: t("theHouse"),
    links: [
      { href: "/beta/home", label: t("about") },
      { href: "/beta/home", label: t("philosophy") },
      { href: "/beta/profile/wardrobe", label: t("ownership") },
    ],
  };

  const assistanceColumn = {
    title: t("assistance"),
    links: [
      { href: "/beta/home", label: t("contact") },
      { href: "/beta", label: t("houseAssistance") },
      { href: "/beta/home", label: t("privacy") },
    ],
  };

  const taglineLines = t("tagline").split("\n");

  return (
    <footer className="mt-auto bg-ds-dark-bg text-ds-dark-text w-full">
      <Container className="py-12">
        {/* ── Brand Hero Section ── */}
        <div className="mb-16 sm:mb-24 lg:mb-32">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {t("brandName")}
          </h2>
          <p className="mt-2 text-base font-medium text-ds-dark-text-muted sm:text-lg lg:text-xl">
            {t("brandTagline")}
          </p>
        </div>

        {/* ── Grid Columns Section ── */}
        {/* Mobile: 2 columns grid (Explore + The House top, Assistance bottom left). Desktop: 3 columns */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:gap-x-16">
          {/* Column 1: Explore */}
          <div className="flex flex-col justify-between">
            <div>
              <h3 className="mb-4 text-base font-bold tracking-normal text-white sm:text-lg">
                {exploreColumn.title}
              </h3>
              <ul className="space-y-3">
                {exploreColumn.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ds-dark-text transition-colors hover:text-white sm:text-base font-normal"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Copyright & Tagline (Positioned below Explore column on Desktop) */}
            <div className="hidden sm:block mt-12 pt-4">
              <p className="text-sm font-bold text-white">{t("copyright")}</p>
              <div className="mt-3 space-y-1">
                {taglineLines.map((line, i) => (
                  <p
                    key={i}
                    className="text-xs sm:text-sm text-ds-dark-text-muted leading-relaxed"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: The House */}
          <div>
            <h3 className="mb-4 text-base font-bold tracking-normal text-white sm:text-lg">
              {houseColumn.title}
            </h3>
            <ul className="space-y-3">
              {houseColumn.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-ds-dark-text transition-colors hover:text-white sm:text-base font-normal"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Assistance */}
          <div>
            <h3 className="mb-4 text-base font-bold tracking-normal text-white sm:text-lg">
              {assistanceColumn.title}
            </h3>
            <ul className="space-y-3">
              {assistanceColumn.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-ds-dark-text transition-colors hover:text-white sm:text-base font-normal"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Mobile Copyright & Tagline (Shown at bottom on Mobile) ── */}
        <div className="block sm:hidden mt-12 pt-6 border-t border-ds-dark-border">
          <p className="text-sm font-bold text-white">{t("copyright")}</p>
          <div className="mt-3 space-y-1">
            {taglineLines.map((line, i) => (
              <p
                key={i}
                className="text-xs text-ds-dark-text-muted leading-relaxed"
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
