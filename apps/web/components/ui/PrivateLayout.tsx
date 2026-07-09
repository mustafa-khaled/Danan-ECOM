import type { ReactNode } from "react";
import { ClientBadge } from "./ClientBadge";
import { GoldDivider } from "./GoldDivider";

export interface PrivateNavItem {
  href: string;
  label: string;
}

export interface PrivateLayoutProps {
  clientName: string;
  navItems?: PrivateNavItem[];
  children: ReactNode;
}

const defaultNav: PrivateNavItem[] = [
  { href: "/home", label: "Home" },
  { href: "/collections", label: "Collections" },
  { href: "/wardrobe", label: "Wardrobe" },
  { href: "/transfers", label: "Transfers" },
];

export function PrivateLayout({ clientName, navItems = defaultNav, children }: PrivateLayoutProps) {
  return (
    <div className="min-h-dvh bg-[var(--color-void)] text-[var(--color-ivory)]">
      <header className="border-b border-[var(--color-border)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="font-display text-2xl tracking-[0.08em] uppercase">DADAN Dijital</p>
            <p className="mt-1 text-xs tracking-[0.16em] uppercase text-[var(--color-ivory-muted)]">Private House</p>
          </div>
          <ClientBadge name={clientName} />
        </div>
        <GoldDivider />
        <nav aria-label="Primary" className="mx-auto max-w-7xl px-4 py-4 sm:px-8">
          <ul className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="inline-flex min-h-11 items-center rounded-[var(--radius-item)] border border-transparent px-4 text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)] transition-colors hover:border-[var(--color-border)] hover:text-[var(--color-gold)] focus-visible:shadow-[var(--shadow-focus)]">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}
