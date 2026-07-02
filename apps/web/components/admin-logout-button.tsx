"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogout } from "../lib/api/admin";

export function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await adminLogout();
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex min-h-11 items-center rounded-[var(--radius-item)] border border-[var(--color-border)] px-4 text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)] transition-colors hover:border-[var(--color-ruby)] hover:text-[var(--color-ruby)] focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-50"
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
