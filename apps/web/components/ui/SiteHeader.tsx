"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LocaleSelect } from "@/shared/providers/locale-provider";
import { primaryNavItems } from "@/shared/lib/nav";

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
      {/* ── Top row: logo + utility icons ── */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 pt-4 pb-2 sm:px-8">
        <Link href="/beta/home" className="flex-shrink-0">
          <Image
            src="/assets/dadan-logo.png"
            alt="DADAN"
            width={120}
            height={20}
            priority
            className="invert"
          />
        </Link>

        <div className="flex items-center gap-4">
          {/* Notification bell */}
          <button
            type="button"
            className="flex size-8 items-center justify-center text-[var(--color-text)] transition-colors hover:text-[var(--color-accent)]"
            aria-label={tNav("notifications")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 2C10.3431 2 8.84344 2.67143 7.75736 3.75736C6.67143 4.84344 6 6.34315 6 8C6 11.0902 5.22047 13.206 4.34966 14.5395C3.90474 15.2185 3.44591 15.6541 3.09778 15.9076C2.92477 16.0337 2.78267 16.1132 2.68712 16.1602C2.63947 16.1836 2.60345 16.1984 2.58186 16.2064L2.56223 16.2134L2 16.4V18H22V16.4L21.4378 16.2134L21.4181 16.2064C21.3966 16.1984 21.3605 16.1836 21.3129 16.1602C21.2173 16.1132 21.0752 16.0337 20.9022 15.9076C20.5541 15.6541 20.0953 15.2185 19.6503 14.5395C18.7795 13.206 18 11.0902 18 8C18 6.34315 17.3286 4.84344 16.2426 3.75736C15.1566 2.67143 13.6569 2 12 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M9 18C9 19.6569 10.3431 21 12 21C13.6569 21 15 19.6569 15 18"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>

          {/* User profile */}
          <Link
            href="/beta/profile"
            className="flex size-8 items-center justify-center text-[var(--color-text)] transition-colors hover:text-[var(--color-accent)]"
            aria-label={tNav("profile")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="8"
                r="4"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M4 21C4 16.5817 7.58172 13 12 13C16.4183 13 20 16.5817 20 21"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </Link>

          {/* Language selector (select box) */}
          <LocaleSelect syncProfile />
        </div>
      </div>

      {/* ── Bottom row: greeting + navigation ── */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 pb-4 sm:px-8">
        <p className="text-sm text-[var(--color-text-muted)]">
          {greeting} {displayName}
        </p>

        <nav aria-label="Primary">
          <ul className="flex flex-wrap items-center gap-4 sm:gap-6">
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
      </div>
    </header>
  );
}
