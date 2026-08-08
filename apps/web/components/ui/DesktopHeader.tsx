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
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 h-19.5 md:h-28.75 transition-all">
      <Container className="h-full flex items-center justify-between relative py-2.5 md:py-4">
        {/* ── Left Section: Logo + Greeting (Stacked on Mobile, Row-space-between structure on Desktop) ── */}
        <div className="flex flex-col justify-center gap-0.5 md:justify-between h-full w-full md:w-auto">
          {/* Logo Brand */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link href="/beta/home" className="inline-flex items-center gap-2">
              <Image
                src="/assets/dadan-logo.png"
                alt="DADAN"
                width={125}
                height={20}
                priority
                className="invert object-contain h-5 md:h-6 w-auto"
              />
            </Link>
          </div>

          {/* Greeting text in SERIF font matching design */}
          <p className="font-display text-xs md:text-sm lg:text-base font-normal text-[#2D2321] tracking-normal">
            {greeting} {displayName}
          </p>
        </div>

        {/* ── Desktop Right Section (Utility Icons Top, Navigation Links Bottom) ── */}
        <div className="hidden md:flex flex-col justify-between items-end h-full">
          {/* Top Utility Icons */}
          <div className="flex items-center gap-5 lg:gap-6">
            {/* Notification Bell Icon */}
            <button
              type="button"
              className="flex items-center justify-center text-[#2D2321] transition-colors hover:text-black"
              aria-label={tNav("notifications")}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
            </button>

            {/* Profile Icon */}
            <Link
              href="/beta/profile/wardrobe"
              className="flex items-center justify-center text-[#2D2321] transition-colors hover:text-black"
              aria-label={tNav("profile")}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </Link>

            {/* Language Selector */}
            <LocaleSelect syncProfile className="text-[#2D2321] font-sans font-medium text-sm" />
          </div>

          {/* Bottom Desktop Navigation Links */}
          <nav aria-label="Primary">
            <ul className="flex items-center gap-6 lg:gap-8">
              {primaryNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`font-sans font-medium text-sm lg:text-[15px] transition-colors ${
                        isActive
                          ? "text-[#000000] font-semibold"
                          : "text-[#374151] hover:text-[#000000]"
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

        {/* ── Mobile Burger Menu Button (Aligned 100% vertically centered in mobile header height) ── */}
        <button
          type="button"
          className="flex md:hidden absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 items-center justify-center p-1.5 text-[#2D2321] transition-colors"
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>
      </Container>
    </header>
  );
}


