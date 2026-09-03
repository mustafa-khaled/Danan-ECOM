"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LocaleSelect } from "@/shared/providers/locale-provider";
import { primaryNavItems } from "@/shared/lib/nav";
import { ProfileMenu } from "@/components/profile-menu";
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
    <header className="sticky top-0 z-50 w-full bg-ds-background border-b border-ds-border h-19.5 min-h-19.5 max-h-19.5 md:h-42.75 md:min-h-42.75 md:max-h-42.75 transition-all">
      <Container className="h-full flex items-center justify-between relative py-2.5 md:py-0 md:pt-[40px] md:pr-[64px] md:pb-[32px] md:pl-[64px] md:gap-[32px]">
        {/* ── Left Section: Logo + Greeting (Stacked on Mobile, Row-space-between structure on Desktop) ── */}
        <div className="flex flex-col justify-center gap-3 md:gap-0 md:justify-between h-full w-full md:w-auto">
          {/* Logo Brand */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link href="/beta/home" className="inline-flex items-center gap-2">
              <Image
                src="/assets/dadan-logo.png"
                alt="DADAN"
                width={246}
                height={40}
                priority
                className="invert object-contain w-30.75 h-5 md:w-61.5 md:h-[40px]"
              />
            </Link>
          </div>

          {/* Greeting text in SERIF font matching design */}
          <p className="font-heading font-semibold text-[14px] md:text-h6 leading-none tracking-[-0.02em] text-neutral-800">
            {greeting} {displayName}
          </p>
        </div>

        {/* ── Desktop Right Section (Utility Icons Top, Navigation Links Bottom) ── */}
        <div className="hidden lg:flex flex-col justify-between items-end h-full">
          {/* Top Utility Icons */}
          <div className="flex items-center gap-5 lg:gap-6">
            {/* Notification Bell Icon */}
            <Link
              href="/beta/notifications"
              className="flex items-center justify-center text-ds-secondary transition-colors hover:text-ds-text"
              aria-label={tNav("notifications")}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
            </Link>

            {/* Profile Menu Dropdown */}
            <ProfileMenu iconSize={24} />

            {/* Language Selector */}
            <LocaleSelect
              syncProfile
              className="[&_svg]:text-ds-secondary font-['Poppins',sans-serif] font-normal text-h5 leading-none text-center tracking-normal"
            />
          </div>

          {/* Bottom Desktop Navigation Links */}
          <nav aria-label="Primary">
            <ul className="flex items-center justify-between gap-2.25 w-172.5 h-6.75">
              {primaryNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`font-body font-medium text-body-lg leading-none tracking-[-0.02em] text-right transition-colors ${
                        isActive
                          ? "text-neutral-800 font-semibold"
                          : "text-neutral-700 hover:text-neutral-800"
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
          className="flex lg:hidden absolute inset-e-4 sm:inset-e-8 top-1/2 -translate-y-1/2 items-center justify-center p-1.5 text-ds-secondary transition-colors"
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
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
