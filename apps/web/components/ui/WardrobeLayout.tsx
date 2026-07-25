"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export interface WardrobeTab {
  href: string;
  labelKey: "owned" | "certificates" | "history" | "transfers";
}

const wardrobeTabs: WardrobeTab[] = [
  { href: "/beta/wardrobe", labelKey: "owned" },
  { href: "/beta/wardrobe/certificates", labelKey: "certificates" },
  { href: "/beta/wardrobe/history", labelKey: "history" },
  { href: "/beta/transfers", labelKey: "transfers" },
];

interface WardrobeLayoutProps {
  children: ReactNode;
  displayName: string;
  ownedCount: number;
  certificatesCount: number;
  pendingTransfers: number;
}

export function WardrobeLayout({
  children,
  displayName,
  ownedCount,
  certificatesCount,
  pendingTransfers,
}: WardrobeLayoutProps) {
  const t = useTranslations("wardrobe");
  const pathname = usePathname();

  return (
    <div>
      <section className="relative -mx-4 mb-8 bg-[var(--color-accent)] px-4 py-16 text-white sm:-mx-8 sm:px-8">
        <h1 className="font-english text-4xl sm:text-5xl">{t("title")}</h1>
      </section>

      <div className="mb-8 flex flex-wrap items-center gap-6 border-b border-[var(--color-border)] pb-6 text-sm">
        <span className="font-medium text-[var(--color-text)]">{displayName}</span>
        <span className="text-[var(--color-text-muted)]">
          {ownedCount} {t("ownedPieces")}
        </span>
        <span className="text-[var(--color-text-muted)]">
          {certificatesCount} {t("certificatesCount")}
        </span>
        <span className="text-[var(--color-text-muted)]">
          {pendingTransfers} {t("pendingTransfers")}
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        <aside>
          <nav aria-label="Wardrobe">
            <ul className="space-y-1">
              {wardrobeTabs.map((tab) => {
                const isActive =
                  tab.href === "/beta/wardrobe"
                    ? pathname === "/beta/wardrobe" || pathname.startsWith("/beta/wardrobe/") && !pathname.includes("/certificates") && !pathname.includes("/history")
                    : pathname.startsWith(tab.href);
                return (
                  <li key={tab.labelKey}>
                    <Link
                      href={tab.href}
                      className={`block px-4 py-2.5 text-sm transition-colors ${
                        isActive
                          ? "bg-[var(--color-surface)] font-medium text-[var(--color-accent)]"
                          : "text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
                      }`}
                    >
                      {t(tab.labelKey)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
