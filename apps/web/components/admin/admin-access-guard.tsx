"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ShieldAlert } from "lucide-react";
import { canAccessAdminPath, isAdminWritePath } from "@/shared/lib/admin-nav";
import { useAdmin } from "@/shared/providers/admin-context";
import type { ReactNode } from "react";

/**
 * Shows an explicit Access Denied for sections the signed-in role cannot open,
 * and for create/edit screens when the role is read-only.
 *
 * Without this, a VIEWER who reached a restricted URL got whatever the failed
 * data fetch threw, and `error.tsx` had to guess at a 403 by string-matching the
 * message — which does not survive production RSC error scrubbing. Role
 * enforcement still lives in the API guards; this is the readable front door.
 */
export function AdminAccessGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { role, canWrite } = useAdmin();
  const t = useTranslations("admin.errors");
  const tc = useTranslations("admin.common");

  const allowed =
    canAccessAdminPath(role, pathname) &&
    (canWrite || !isAdminWritePath(pathname));

  if (allowed) return <>{children}</>;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-red-50 text-red-500">
          <ShieldAlert className="size-8" />
        </div>
        <h1 className="mb-4 font-heading text-3xl font-bold tracking-tight text-ds-text">
          {t("accessDeniedTitle")}
        </h1>
        <p className="mb-6 font-body text-sm text-ds-text-secondary">
          {t("accessDeniedDescription")}
        </p>
        <Link
          href="/admin/overview"
          className="rounded-(--radius-sm) bg-ds-primary px-5 py-2.5 text-sm font-medium text-ds-primary-foreground transition-colors hover:bg-ds-primary-hover"
        >
          {tc("backToDashboard")}
        </Link>
      </div>
    </div>
  );
}
