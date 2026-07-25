"use client";

import Link from "next/link";
import { useEffect } from "react";
import { reportError } from "@/shared/lib/sentry";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-void px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-4 font-display text-4xl text-ivory">
          Something went wrong
        </h1>
        <p className="mb-8 text-ivory-muted">
          We encountered an unexpected error. Please try again or contact support
          if the problem persists.
        </p>
        {error.digest && (
          <p className="mb-6 font-mono text-xs text-ivory-muted">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <button
            onClick={reset}
            className="rounded-[var(--radius-button)] bg-ivory px-6 py-3 font-medium text-void transition-opacity hover:opacity-90"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-[var(--radius-button)] border border-border bg-transparent px-6 py-3 font-medium text-ivory transition-colors hover:bg-surface"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
