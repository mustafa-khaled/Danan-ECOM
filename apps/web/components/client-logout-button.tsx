"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { useClientLogout } from "@/features/auth";

interface ClientLogoutButtonProps {
  iconOnly?: boolean;
}

export function ClientLogoutButton({ iconOnly = false }: ClientLogoutButtonProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const { logout, isPending } = useClientLogout();

  async function handleLogout() {
    await logout();
    router.push("/beta");
    router.refresh();
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={isPending}
        className="flex size-9 items-center justify-center text-ds-text transition-colors hover:text-ds-secondary disabled:opacity-50"
        aria-label={t("logout")}
      >
        <LogOut width={20} height={20} aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="flex items-center justify-center gap-2 text-ds-secondary transition-colors hover:text-ds-text disabled:opacity-50"
      aria-label={t("logout")}
    >
      <LogOut width={24} height={24} aria-hidden="true" />
    </button>
  );
}
