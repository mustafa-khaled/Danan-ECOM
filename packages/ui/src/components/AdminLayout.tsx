import type { ReactNode } from "react";
import { GoldDivider } from "./GoldDivider";

export interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AdminLayout({ children, title = "DADAN Admin" }: AdminLayoutProps) {
  return (
    <div data-theme="admin" className="min-h-dvh bg-[var(--color-void)] text-[var(--color-ivory)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-8">
          <div>
            <p className="font-display text-xl tracking-[0.06em] uppercase">{title}</p>
            <p className="text-xs tracking-[0.14em] uppercase text-[var(--color-ivory-muted)]">
              Staff Dashboard
            </p>
          </div>
        </div>
        <GoldDivider />
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}
