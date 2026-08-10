"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export interface AccountNavItem {
  href: string;
  labelKey:
    | "overview"
    | "personalInfo"
    | "myCollection"
    | "certificates"
    | "wishlist";
}

const accountNavItems: AccountNavItem[] = [
  { href: "/beta/profile", labelKey: "overview" },
  { href: "/beta/profile", labelKey: "personalInfo" },
  { href: "/beta/profile/wardrobe", labelKey: "myCollection" },
  { href: "/beta/profile/certificates", labelKey: "certificates" },
  { href: "/beta/saved", labelKey: "wishlist" },
];

interface AccountLayoutProps {
  children: ReactNode;
  title: string;
}

export function AccountLayout({ children, title }: AccountLayoutProps) {
  const t = useTranslations("profile");
  const pathname = usePathname();

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside>
        <nav aria-label="Account">
          <ul className="space-y-1">
            {accountNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.labelKey}>
                  <Link
                    href={item.href}
                    className={`block px-4 py-2.5 text-sm rounded-(--radius-sm) transition-colors ${
                      isActive
                        ? "bg-ds-surface font-semibold text-ds-text"
                        : "text-ds-text-secondary hover:text-ds-text hover:bg-ds-surface/50"
                    }`}
                  >
                    {t(item.labelKey)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      <div>
        <h1 className="mb-8 font-heading text-3xl text-ds-text">
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}
