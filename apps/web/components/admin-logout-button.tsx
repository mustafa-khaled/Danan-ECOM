"use client";

import { useRouter } from "next/navigation";
import { useLogout } from "@/features/auth";
import { Button } from "@/components/ui/Button";

export function AdminLogoutButton() {
  const router = useRouter();
  const { logout, isPending } = useLogout();

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
      {isPending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
