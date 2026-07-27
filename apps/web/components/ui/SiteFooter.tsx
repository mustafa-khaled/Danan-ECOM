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

  const taglineLines = t("tagline").split("\n");

  return (
    <footer
      className="mt-auto text-white"
      style={{ backgroundColor: "#1c2028" }}
    >
      {/* Brand hero section */}
      <div className="px-6 pt-12 pb-0 sm:px-12 lg:px-16">
        <h2
          className="text-4xl font-bold tracking-tight text-white sm:text-5xl"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {t("brandName")}
        </h2>
        <p
          className="mt-2 text-lg sm:text-xl"
          style={{ color: "rgba(255, 255, 255, 0.35)" }}
        >
          {t("brandTagline")}
        </p>
      </div>

      {/* Spacer matching the design's generous whitespace */}
      <div className="h-32 sm:h-44 lg:h-56" />

      {/* Navigation columns */}
      <div className="grid gap-10 px-6 pb-12 sm:grid-cols-3 sm:px-12 lg:px-16">
        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="mb-4 text-base font-bold tracking-wide text-white sm:text-lg">
              {column.title}
            </h3>
            <ul className="space-y-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors sm:text-base"
                    style={{ color: "rgba(255, 255, 255, 0.7)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "rgba(255, 255, 255, 1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)")
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom section — copyright & tagline */}
      <div className="px-6 pb-10 pt-4 sm:px-12 lg:px-16">
        <p
          className="text-sm font-medium text-white"
          style={{ color: "rgba(255, 255, 255, 0.7)" }}
        >
          {t("copyright")}
        </p>
        <div className="mt-3">
          {taglineLines.map((line, i) => (
            <p
              key={i}
              className="text-sm leading-relaxed"
              style={{ color: "rgba(255, 255, 255, 0.5)" }}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </footer>
  );
}
