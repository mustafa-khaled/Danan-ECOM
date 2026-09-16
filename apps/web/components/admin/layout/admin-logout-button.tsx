"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLogout } from "@/features/auth";
import { Button } from "@/components/ui/Button";

export function AdminLogoutButton() {
  const router = useRouter();
  const { logout, isPending } = useLogout();
  const t = useTranslations("admin.common");

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
    <Button
      type="button"
      onClick={handleLogout}
      loading={isPending}
      variant="outline"
      size="sm"
    >
      {isPending ? t("saving") : t("signOut")}
    </Button>
  );
}
