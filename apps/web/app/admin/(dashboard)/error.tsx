"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
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
        <h1 className="mb-4 font-heading text-3xl font-bold tracking-tight text-ds-text">
          Something went wrong
        </h1>
        <p className="mb-6 text-sm text-ds-text-secondary font-body">
          An unexpected error occurred while loading this page. Please try again or return to the dashboard.
        </p>
        {error.digest && (
          <p className="mb-6 font-mono text-xs text-ds-text-muted">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button onClick={reset} variant="primary">
            Try Again
          </Button>
          <Link href="/admin/dashboard">
            <Button variant="outline">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
