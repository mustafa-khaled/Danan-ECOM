"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { reportError } from "@/shared/lib/sentry";
import { ShieldAlert } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string; status?: number };
  reset: () => void;
}) {
  const t = useTranslations("admin.errors");
  const tc = useTranslations("admin.common");

  const isAccessDenied =
    error.status === 403 ||
    error.message?.includes("403") ||
    error.message?.toLowerCase().includes("forbidden") ||
    error.message?.toLowerCase().includes("access denied");

  useEffect(() => {
    reportError(error, { digest: error.digest, context: "admin" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center flex flex-col items-center">
        {isAccessDenied ? (
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6">
            <ShieldAlert className="size-8" />
          </div>
        ) : null}
        <h1 className="mb-4 font-heading text-3xl font-bold tracking-tight text-ds-text">
          {isAccessDenied ? t("accessDeniedTitle") : t("title")}
        </h1>
        <p className="mb-6 text-sm text-ds-text-secondary font-body">
          {isAccessDenied ? t("accessDeniedDescription") : t("description")}
        </p>
        {error.digest && (
          <p className="mb-6 font-mono text-xs text-ds-text-muted">
            {t("errorId", { id: error.digest })}
          </p>
        )}
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          {!isAccessDenied && (
            <Button onClick={reset} variant="primary">
              {tc("tryAgain")}
            </Button>
          )}
          <Link href="/admin/overview">
            <Button variant={isAccessDenied ? "primary" : "outline"}>
              {tc("backToDashboard")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
