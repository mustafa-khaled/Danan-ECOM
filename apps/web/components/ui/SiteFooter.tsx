"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function SiteFooter() {
  const t = useTranslations("footer");

  const columns = [
    {
      title: t("explore"),
      links: [
        { href: "/beta/home", label: t("stories") },
        { href: "/beta/collections", label: t("collections") },
        { href: "/beta/wardrobe", label: t("myCollection") },
      ],
    },
    {
      title: t("theHouse"),
      links: [
        { href: "/beta/home", label: t("about") },
        { href: "/beta/home", label: t("philosophy") },
        { href: "/beta/wardrobe", label: t("ownership") },
      ],
    },
    {
      title: t("assistance"),
      links: [
        { href: "/beta/home", label: t("contact") },
        { href: "/beta", label: t("houseAssistance") },
        { href: "/beta/home", label: t("privacy") },
      ],
    },
  ];

  return (
    <footer className="mt-auto bg-[var(--color-accent)] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:grid-cols-3 sm:px-8">
        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="mb-4 text-xs tracking-[0.16em] uppercase text-white/70">
              {column.title}
            </h3>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/90 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-4 py-6 text-center sm:px-8">
        <p className="text-xs text-white/60">{t("copyright")}</p>
        <p className="mt-1 text-xs tracking-[0.12em] uppercase text-white/40">
          {t("tagline")}
        </p>
      </div>
    </footer>
  );
}
