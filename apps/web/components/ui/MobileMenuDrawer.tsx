"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LocaleSelect } from "@/shared/providers/locale-provider";
import { primaryNavItems } from "@/shared/lib/nav";
import { ClientLogoutButton } from "@/components/client-logout-button";

interface MobileMenuDrawerProps {
  isOpen: boolean;
  pathname: string;
  onClose: () => void;
}

export function MobileMenuDrawer({
  isOpen,
  pathname,
  onClose,
}: MobileMenuDrawerProps) {
  const tNav = useTranslations("nav");

  return (
    <div className="lg:hidden">
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-50 bg-ds-overlay-heavy backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Side menu content panel - Full Height & Solid Background */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex h-screen w-4/5 max-w-xs flex-col justify-between border-l border-ds-border bg-ds-background p-6 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen
            ? "translate-x-0 pointer-events-auto"
            : "translate-x-full pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Top row in drawer: Close button */}
          <div className="flex items-center justify-between border-b border-ds-border pb-4">
            <span className="font-heading text-lg font-medium text-ds-text">
              DADAN
            </span>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center text-ds-text hover:text-ds-secondary"
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
                      onClick={onClose}
                      className={`block font-body text-lg font-medium tracking-tight transition-colors ${
                        isActive
                          ? "text-ds-secondary font-semibold"
                          : "text-ds-text-secondary hover:text-ds-text"
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
        <div className="border-t border-ds-border pt-4 bg-ds-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Notification bell */}
              <Link
                href="/beta/notifications"
                type="button"
                className="flex size-9 items-center justify-center text-ds-text transition-colors hover:text-ds-secondary"
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
              </Link>

              {/* User profile */}
              <Link
                href="/beta/profile/wardrobe"
                onClick={onClose}
                className="flex size-9 items-center justify-center text-ds-text transition-colors hover:text-ds-secondary"
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
            <LocaleSelect syncProfile className="[&_svg]:text-ds-secondary " />

            {/* Logout */}
            <ClientLogoutButton iconOnly />
          </div>
        </div>
      </div>
    </div>
  );
}
