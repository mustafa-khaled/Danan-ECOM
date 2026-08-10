"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Owned Pieces", href: "/beta/profile/wardrobe" },
  { label: "Certificates", href: "/beta/profile/certificates" },
  { label: "History", href: "/beta/profile/history" },
  { label: "Transfers", href: "/beta/profile/transfers" },
  { label: "Profile Management", href: "/beta/profile" },
];

export default function ProfileAside() {
  const pathname = usePathname();

  return (
    <aside className="w-full">
      <nav aria-label="Profile Navigation">
        <ul className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3 lg:gap-2">
          {navItems.map((item, index) => {
            const isActive =
              item.href === "/beta/profile"
                ? pathname === "/beta/profile"
                : pathname === item.href || pathname.startsWith(item.href + "/");

            const isLastMobile = index === navItems.length - 1;

            return (
              <li
                key={item.href}
                className={isLastMobile ? "col-span-2 lg:col-span-1" : ""}
              >
                <Link
                  href={item.href}
                  className={`block w-full px-4 py-3 text-center lg:text-start text-xs sm:text-sm font-medium rounded-[var(--radius-sm)] transition-colors duration-200 ${
                    isActive
                      ? "bg-ds-primary text-ds-primary-foreground font-semibold"
                      : "bg-ds-surface-warm text-ds-text hover:bg-ds-surface-warm-hover"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
