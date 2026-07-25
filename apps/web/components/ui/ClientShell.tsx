import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export interface ClientShellProps {
  displayName: string;
  children: ReactNode;
}

export function ClientShell({ displayName, children }: ClientShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-white text-[var(--color-text)]">
      <SiteHeader displayName={displayName} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-8">{children}</main>
      <SiteFooter />
    </div>
  );
}
