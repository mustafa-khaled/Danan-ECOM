"use client";

import * as Sentry from "@sentry/nextjs";

export function reportError(error: Error, context?: Record<string, unknown>) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
  console.error(error, context);
}
