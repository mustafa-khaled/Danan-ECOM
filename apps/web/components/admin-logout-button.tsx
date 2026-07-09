"use client";

import { useRouter } from "next/navigation";
import { useLogout } from "@/features/auth";

export function AdminLogoutButton() {
  const router = useRouter();
  const {
    mutateAsync: logout,
    isPending,
  } = useLogout();

  async function handleLogout() {
    try {
      await logout(undefined);
    } catch {
      /* error handling is not needed for logout */
    }
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="inline-flex min-h-11 items-center rounded-[var(--radius-item)] border border-[var(--color-border)] px-4 text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)] transition-colors hover:border-[var(--color-ruby)] hover:text-[var(--color-ruby)] focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-50"
    >
      {isPending ? "Signing out\u2026" : "Sign out"}
    </button>
  );
}
