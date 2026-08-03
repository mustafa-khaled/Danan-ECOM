"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LocaleSelect } from "@/shared/providers/locale-provider";
import { primaryNavItems } from "@/shared/lib/nav";
import Container from "./container";

interface DesktopHeaderProps {
  greeting: string;
  displayName: string;
  pathname: string;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export function DesktopHeader({
  greeting,
  displayName,
  pathname,
  isMobileMenuOpen,
  onToggleMobileMenu,
}: DesktopHeaderProps) {
  const tNav = useTranslations("nav");

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-md">
      {/* ── Top row: logo + utility icons / burger button ── */}
      <Container>
        <div className="flex items-center justify-between pt-4 pb-2">
          <Link href="/beta/home" className="shrink-0">
            <Image
              src="/assets/dadan-logo.png"
              alt="DADAN"
              width={120}
              height={20}
              priority
              className="invert"
            />
          </Link>

          {/* Desktop utility icons */}
          <div className="hidden md:flex items-center gap-4">
            {/* Notification bell */}
            <button
              type="button"
              className="flex size-8 items-center justify-center text-(--color-text) transition-colors hover:text-(--color-accent)"
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
                  d="M12 2C10.3431 2 8.84344 2.67143 7.75736 3.75736C6.67143 4.84344 6 6.34315 6 8C6 11.0902 5.22047 13.206 4.34966 14.5395C3.90474 15.2185 3.44591 15.6541 3.09778 15.9076C2.92477 16.0337 2.78267 16.1132 2.68712 16.1602C2.63947 16.1836 2.60345 16.1984 2.58186 16.2064L2.56223 16.2134L2 16.4V18H22V16.4L21.4378 16.2134L21.4181 16.2064C21.3966 16.1984 21.3605 16.1836 21.3129 16.1602C21.2173 16.1132 21.0752 16.0337 20.9022 15.9076C20.5541 15.2185 20.0953 15.2185 19.6503 14.5395C18.7795 13.206 18 11.0902 18 8C18 6.34315 17.3286 4.84344 16.2426 3.75736C15.1566 2.67143 13.6569 2 12 2Z"
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
              className="flex size-8 items-center justify-center text-(--color-text) transition-colors hover:text-(--color-accent)"
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

            {/* Language selector */}
            <LocaleSelect syncProfile />
          </div>

          {/* Mobile burger toggle button */}
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-md bg-white text-(--color-text) shadow-xs transition-colors hover:bg-gray-50 hover:text-(--color-accent) md:hidden"
            onClick={onToggleMobileMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {/* ── Bottom row: greeting (Mobile & Desktop) + desktop navigation ── */}
        <div className="flex items-center justify-between pt-1 pb-4">
          <p className="font-english text-base font-normal text-(--color-text)">
            {greeting} {displayName}
          </p>

          <nav aria-label="Primary" className="hidden md:block text-right">
            <ul className="flex flex-wrap items-center justify-end gap-6 sm:gap-8">
              {primaryNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`font-manrope font-medium text-lg leading-[100%] tracking-[-0.02em] transition-colors ${
                        isActive
                          ? "text-(--color-accent)"
                          : "text-(--color-text-muted) hover:text-(--color-accent)"
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
      </Container>
    </header>
  );
}
