import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════════
   BADGE — Design System Status Badge
   ═══════════════════════════════════════════════════════════════════════════
   Variants: default | primary | success | warning | error | info | outline
   Sizes:    sm | md
   ═══════════════════════════════════════════════════════════════════════════ */

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "outline";

export type BadgeSize = "sm" | "md";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "bg-ds-surface text-ds-text-secondary border-ds-border",
  primary:
    "bg-ds-primary/10 text-ds-primary border-ds-primary/30",
  success:
    "bg-ds-success-bg text-ds-success-text border-ds-success-border",
  warning:
    "bg-ds-warning-bg text-ds-warning-text border-ds-warning-border",
  error:
    "bg-ds-error-bg text-ds-error-text border-ds-error-border",
  info:
    "bg-ds-info-bg text-ds-info-text border-ds-info-border",
  outline:
    "bg-transparent text-ds-text-secondary border-ds-border",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-3 py-1 text-xs",
};

export function Badge({
  children,
  variant = "default",
  size = "sm",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-(--radius-sm) border font-mono font-medium tracking-wider uppercase whitespace-nowrap",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
