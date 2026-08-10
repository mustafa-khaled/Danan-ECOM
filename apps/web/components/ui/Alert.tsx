"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════════
   ALERT — Design System Alert / Notification Banner
   ═══════════════════════════════════════════════════════════════════════════
   Variants: info | success | error | warning
   Features: dismissible, icon, custom content
   ═══════════════════════════════════════════════════════════════════════════ */

export type AlertVariant = "info" | "success" | "error" | "warning";

export interface AlertProps {
  variant?: AlertVariant;
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  icon?: ReactNode;
}

const variantStyles: Record<
  AlertVariant,
  { container: string; icon: string; text: string }
> = {
  info: {
    container: "bg-ds-info-bg border-ds-info-border",
    icon: "text-ds-info-text",
    text: "text-ds-info-text",
  },
  success: {
    container: "bg-ds-success-bg border-ds-success-border",
    icon: "text-ds-success-text",
    text: "text-ds-success-text",
  },
  error: {
    container: "bg-ds-error-bg border-ds-error-border",
    icon: "text-ds-error-text",
    text: "text-ds-error-text",
  },
  warning: {
    container: "bg-ds-warning-bg border-ds-warning-border",
    icon: "text-ds-warning-text",
    text: "text-ds-warning-text",
  },
};

function DefaultIcon({ variant }: { variant: AlertVariant }) {
  if (variant === "error") {
    return (
      <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 7a.75.75 0 100-1.5.75.75 0 000 1.5z" />
      </svg>
    );
  }
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zM8 11a.75.75 0 100-1.5.75.75 0 000 1.5z" />
    </svg>
  );
}

export function Alert({
  variant = "info",
  children,
  dismissible = true,
  onDismiss,
  className,
  icon,
}: AlertProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const styles = variantStyles[variant];

  function handleDismiss() {
    setDismissed(true);
    onDismiss?.();
  }

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-3 rounded-(--radius-md) border px-4 py-3 text-sm",
        styles.container,
        className,
      )}
    >
      <span className={styles.icon}>
        {icon || <DefaultIcon variant={variant} />}
      </span>
      <span className={cn("flex-1", styles.text)}>{children}</span>
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-sm p-0.5 transition-opacity hover:opacity-70",
            styles.text,
          )}
          aria-label="Dismiss alert"
        >
          <svg
            className="size-4"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M4.47 4.47a.75.75 0 011.06 0L8 6.94l2.47-2.47a.75.75 0 111.06 1.06L9.06 8l2.47 2.47a.75.75 0 11-1.06 1.06L8 9.06l-2.47 2.47a.75.75 0 01-1.06-1.06L6.94 8 4.47 5.53a.75.75 0 010-1.06z" />
          </svg>
        </button>
      )}
    </div>
  );
}
