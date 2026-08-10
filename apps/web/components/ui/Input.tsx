"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════════
   INPUT — Design System Form Input
   ═══════════════════════════════════════════════════════════════════════════
   States: default | focus | error | success | warning | disabled
   Features: label, helperText, error/success/warning messages, fullWidth
   ═══════════════════════════════════════════════════════════════════════════ */

type InputStatus = "default" | "error" | "success" | "warning";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Label displayed above the input */
  label?: string;
  /** Helper/informational text below the input */
  helperText?: string;
  /** Error message — sets the input into error state */
  error?: string;
  /** Success message — sets the input into success state */
  success?: string;
  /** Warning message — sets the input into warning state */
  warning?: string;
  /** Make the input full-width */
  fullWidth?: boolean;
  /** Input size */
  size?: "sm" | "md" | "lg";
  /** Optional right-side icon/element */
  trailingIcon?: ReactNode;
}

const statusStyles: Record<InputStatus, string> = {
  default: "border-ds-border focus-within:border-ds-border-focus",
  error: "border-ds-error focus-within:border-ds-error",
  success: "border-ds-success focus-within:border-ds-success",
  warning: "border-ds-warning focus-within:border-ds-warning",
};

const statusMessageStyles: Record<Exclude<InputStatus, "default">, string> = {
  error: "text-ds-error-text",
  success: "text-ds-success-text",
  warning: "text-ds-warning-text",
};

const sizeStyles = {
  sm: "min-h-9 px-3 text-xs",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-sm",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      label,
      helperText,
      error,
      success,
      warning,
      fullWidth = true,
      size = "md",
      className,
      id: externalId,
      trailingIcon,
      disabled,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const inputId = externalId || generatedId;
    const helperId = `${inputId}-helper`;

    // Determine status from props
    const status: InputStatus = error
      ? "error"
      : success
        ? "success"
        : warning
          ? "warning"
          : "default";

    const statusMessage = error || success || warning;

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={inputId}
            className="ds-label text-ds-text"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            "relative flex items-center rounded-(--radius-sm) border bg-ds-background transition-colors duration-200",
            statusStyles[status],
            disabled && "opacity-50 cursor-not-allowed bg-ds-disabled-bg",
          )}
        >
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={status === "error" ? true : undefined}
            aria-describedby={
              statusMessage || helperText ? helperId : undefined
            }
            className={cn(
              "w-full bg-transparent outline-none placeholder:text-ds-text-muted text-ds-text font-body",
              "disabled:cursor-not-allowed",
              sizeStyles[size],
              className,
            )}
            {...props}
          />
          {trailingIcon && (
            <span className="absolute inset-e-3 top-1/2 -translate-y-1/2 pointer-events-none text-ds-text-muted">
              {trailingIcon}
            </span>
          )}
        </div>
        {(statusMessage || helperText) && (
          <p
            id={helperId}
            role={status === "error" ? "alert" : undefined}
            className={cn(
              "flex items-center gap-1 text-xs",
              status !== "default"
                ? statusMessageStyles[status]
                : "text-ds-text-muted",
            )}
          >
            {status !== "default" && (
              <StatusIcon status={status} />
            )}
            {statusMessage || helperText}
          </p>
        )}
      </div>
    );
  },
);

/* ── Small status icon for helper messages ── */
function StatusIcon({ status }: { status: Exclude<InputStatus, "default"> }) {
  return (
    <svg
      className="size-3.5 shrink-0"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 7a.75.75 0 100-1.5.75.75 0 000 1.5z" />
    </svg>
  );
}
