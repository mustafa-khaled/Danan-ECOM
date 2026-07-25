"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useClientLogout } from "@/features/auth";

export function ClientLogoutButton() {
  const t = useTranslations("auth");
  const router = useRouter();
  const logout = useClientLogout();

  async function handleLogout() {
    await logout.mutateAsync();
    router.push("/beta");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={logout.isPending}
      className="text-xs tracking-[0.1em] uppercase text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)] disabled:opacity-50"
    >
      {t("logout")}
    </button>
  );
}
