import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DadanSpinner } from "@/shared/components/feedback/loading-state";

/* ═══════════════════════════════════════════════════════════════════════════
   BUTTON — Unified Design System Button
   ═══════════════════════════════════════════════════════════════════════════
   Variants: primary | secondary | teal | outline | ghost | destructive
   Sizes:    sm | md | lg
   Features: loading, disabled, fullWidth, icon support, arrow variant
   ═══════════════════════════════════════════════════════════════════════════ */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "teal"
  | "outline"
  | "ghost"
  | "destructive";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  arrow?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    "bg-ds-primary text-ds-primary-foreground",
    "hover:bg-ds-primary-hover active:bg-ds-primary-active",
    "focus-visible:shadow-[var(--shadow-focus)]",
  ].join(" "),

  secondary: [
    "bg-ds-secondary text-ds-secondary-foreground",
    "hover:bg-ds-secondary-hover active:bg-ds-secondary-active",
    "focus-visible:shadow-[var(--shadow-focus)]",
  ].join(" "),

  teal: [
    "bg-ds-teal text-ds-teal-foreground",
    "hover:bg-ds-teal-hover active:bg-ds-teal-active",
    "focus-visible:shadow-[var(--shadow-focus)]",
  ].join(" "),

  outline: [
    "border border-ds-border bg-transparent text-ds-text",
    "hover:border-ds-border-hover hover:text-ds-text",
    "focus-visible:shadow-[var(--shadow-focus)]",
  ].join(" "),

  ghost: [
    "bg-transparent text-ds-text",
    "hover:bg-ds-surface",
    "focus-visible:shadow-[var(--shadow-focus)]",
  ].join(" "),

  destructive: [
    "bg-ds-error text-white",
    "hover:bg-red-700 active:bg-red-800",
    "focus-visible:shadow-[var(--shadow-focus-error)]",
  ].join(" "),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-1.5 text-xs gap-1.5",
  md: "min-h-11 px-5 py-2.5 text-sm gap-2",
  lg: "min-h-12 px-8 py-3 text-sm gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      arrow = false,
      disabled,
      className,
      children,
      type = "button",
      iconLeft,
      iconRight,
      ...props
    },
    ref,
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          /* Base */
          "inline-flex items-center justify-center font-medium tracking-wide transition-colors duration-200 outline-none cursor-pointer select-none",
          "rounded-(--radius-button)",
          /* Variant */
          variantClasses[variant],
          /* Size */
          sizeClasses[size],
          /* Full width */
          fullWidth && "w-full",
          /* Disabled */
          isDisabled && "pointer-events-none opacity-50 cursor-not-allowed",
          className,
        )}
        {...props}
      >
        {loading ? (
          <DadanSpinner size="sm" />
        ) : (
          <>
            {iconLeft}
            <span>{children}</span>
            {arrow && (
              <span className="rtl:rotate-180 inline-block" aria-hidden="true">
                →
              </span>
            )}
            {iconRight}
          </>
        )}
      </button>
    );
  },
);
