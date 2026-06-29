import type { ButtonHTMLAttributes } from "react";

const sizeClasses = {
  sm: "min-h-11 px-4 text-xs tracking-[0.12em] uppercase",
  md: "min-h-11 px-6 text-sm tracking-[0.1em] uppercase",
  lg: "min-h-12 px-8 text-sm tracking-[0.1em] uppercase",
} as const;

const variantClasses = {
  primary:
    "border border-[var(--color-gold)] bg-transparent text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-[var(--color-void)] focus-visible:shadow-[var(--shadow-focus)]",
  ghost:
    "border border-[var(--color-border)] bg-transparent text-[var(--color-ivory)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold-light)] focus-visible:shadow-[var(--shadow-focus)]",
  danger:
    "border border-[var(--color-ruby)] bg-transparent text-[var(--color-ruby)] hover:bg-[var(--color-ruby)] hover:text-[var(--color-ivory)] focus-visible:shadow-[var(--shadow-focus)]",
} as const;

export type LuxuryButtonVariant = keyof typeof variantClasses;
export type LuxuryButtonSize = keyof typeof sizeClasses;

export interface LuxuryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: LuxuryButtonVariant;
  size?: LuxuryButtonSize;
  loading?: boolean;
}

export function LuxuryButton({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  type = "button",
  children,
  ...props
}: LuxuryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center rounded-[var(--radius-button)] font-body transition-colors duration-200",
        "disabled:cursor-not-allowed disabled:opacity-45",
        sizeClasses[size],
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {loading ? "…" : children}
    </button>
  );
}
