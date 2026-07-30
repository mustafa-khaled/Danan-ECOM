"use client";

import Link from "next/link";
import { useEffect } from "react";
import { LuxuryButton } from "@/components/ui";
import { reportError } from "@/shared/lib/sentry";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { digest: error.digest, context: "admin" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-4 font-display text-3xl tracking-[0.06em] uppercase">
          Something went wrong
        </h1>
        <p className="mb-6 text-sm text-[var(--color-ivory-muted)]">
          An unexpected error occurred while loading this page. Please try again or return to the dashboard.
        </p>
        {error.digest && (
          <p className="mb-6 font-mono text-xs text-[var(--color-ivory-muted)]">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <LuxuryButton onClick={reset}>
            Try Again
          </LuxuryButton>
          <Link href="/admin/dashboard">
            <LuxuryButton variant="ghost">
              Back to Dashboard
            </LuxuryButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
