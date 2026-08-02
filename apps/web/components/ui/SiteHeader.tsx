"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LocaleSelect } from "@/shared/providers/locale-provider";
import { useClientContext } from "@/shared/providers/client-context";
import { primaryNavItems } from "@/shared/lib/nav";
import Container from "./container";

function getGreetingKey(): "morning" | "afternoon" | "evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function SiteHeader() {
  const { displayName } = useClientContext();
  const t = useTranslations("greeting");
  const tNav = useTranslations("nav");
  const pathname = usePathname();
  const greeting = t(getGreetingKey());

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll & listen for Escape key when menu is open
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

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

          {/* Mobile burger toggle button with white background & larger icon */}
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-md border border-black/10 bg-white text-(--color-text) shadow-xs transition-colors hover:bg-gray-50 hover:text-(--color-accent) md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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

      {/* ── Mobile Side Menu Drawer ── */}
      <div className="md:hidden">
        {/* Backdrop overlay */}
        <div
          className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
            isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />

        {/* Side menu content panel - Full Height & Solid White Background */}
        <div
          className={`fixed inset-y-0 right-0 z-50 flex h-dvh min-h-screen w-4/5 max-w-xs flex-col justify-between border-l border-black/10 bg-white p-6 shadow-2xl transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"
          }`}
        >
          <div className="flex flex-col gap-6">
            {/* Top row in drawer: Close button */}
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <span className="font-english text-lg font-medium text-(--color-text)">
                DADAN
              </span>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex size-8 items-center justify-center text-(--color-text) hover:text-(--color-accent)"
                aria-label="Close menu"
              >
                <svg
                  width="22"
                  height="22"
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
              </button>
            </div>

            {/* Navigation links */}
            <nav aria-label="Mobile Navigation">
              <ul className="flex flex-col gap-4">
                {primaryNavItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block font-manrope text-lg font-medium tracking-[-0.02em] transition-colors ${
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

          {/* Bottom utilities section: profile, notification & language icons */}
          <div className="border-t border-black/10 pt-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Notification bell */}
                <button
                  type="button"
                  className="flex size-9 items-center justify-center text-(--color-text) transition-colors hover:text-(--color-accent)"
                  aria-label={tNav("notifications")}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 2C10.3431 2 8.84344 2.67143 7.75736 3.75736C6.67143 4.84344 6 6.34315 6 8C6 11.0902 5.22047 13.206 4.34966 14.5395C3.90474 15.2185 3.44591 15.6541 3.09778 15.9076C2.92477 16.1132 2.78267 16.1132 2.68712 16.1602C2.63947 16.1836 2.60345 16.1984 2.58186 16.2064L2.56223 16.2134L2 16.4V18H22V16.4L21.4378 16.2134L21.4181 16.2064C21.3966 16.1984 21.3605 16.1836 21.3129 16.1602C21.2173 16.1132 21.0752 16.0337 20.9022 15.9076C20.5541 15.6541 20.0953 15.2185 19.6503 14.5395C18.7795 13.206 18 11.0902 18 8C18 6.34315 17.3286 4.84344 16.2426 3.75736C15.1566 2.67143 13.6569 2 12 2Z"
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
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex size-9 items-center justify-center text-(--color-text) transition-colors hover:text-(--color-accent)"
                  aria-label={tNav("profile")}
                >
                  <svg
                    width="20"
                    height="20"
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
              </div>

              {/* Language selector */}
              <LocaleSelect syncProfile />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}



