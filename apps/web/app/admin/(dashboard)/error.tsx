"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { reportError } from "@/shared/lib/sentry";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("admin.errors");
  const tc = useTranslations("admin.common");

  useEffect(() => {
    reportError(error, { digest: error.digest, context: "admin" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-4 font-heading text-3xl font-bold tracking-tight text-ds-text">
          {t("title")}
        </h1>
        <p className="mb-6 text-sm text-ds-text-secondary font-body">
          {t("description")}
        </p>
        {error.digest && (
          <p className="mb-6 font-mono text-xs text-ds-text-muted">
            {t("errorId", { id: error.digest })}
          </p>
        )}
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button onClick={reset} variant="primary">
            {tc("tryAgain")}
          </Button>
          <Link href="/admin/overview">
            <Button variant="outline">{tc("backToDashboard")}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
