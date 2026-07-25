"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/shared/providers/locale-provider";
import { primaryNavItems } from "@/shared/lib/nav";
import { ClientLogoutButton } from "@/components/client-logout-button";

interface SiteHeaderProps {
  displayName: string;
}

function getGreetingKey(): "morning" | "afternoon" | "evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function SiteHeader({ displayName }: SiteHeaderProps) {
  const t = useTranslations("greeting");
  const tNav = useTranslations("nav");
  const pathname = usePathname();
  const greeting = t(getGreetingKey());

  return (
    <header className="border-b border-[var(--color-border)] bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <p className="text-sm text-[var(--color-text-muted)]">
          {greeting} {displayName}
        </p>

        <Link href="/beta/home" className="absolute start-1/2 -translate-x-1/2">
          <Image
            src="/assets/dadan-logo.png"
            alt="DADAN"
            width={120}
            height={20}
            priority
            className="invert"
          />
        </Link>

        <div className="flex items-center gap-3">
          <LocaleSwitcher syncProfile />
          <Link
            href="/beta/profile"
            className="flex size-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)]"
            aria-label={tNav("profile")}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" />
              <path
                d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
          </Link>
          <ClientLogoutButton />
        </div>
      </div>

      <nav aria-label="Primary" className="mx-auto max-w-7xl px-4 pb-4 sm:px-8">
        <ul className="flex flex-wrap items-center justify-center gap-6">
          {primaryNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`text-xs tracking-[0.14em] uppercase transition-colors ${
                    isActive
                      ? "text-[var(--color-accent)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
                  }`}
                >
                  {tNav(item.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
