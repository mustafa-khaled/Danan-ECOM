import Link from "next/link";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════════
   ARROW LINK — Navigation link with arrow icon
   ═══════════════════════════════════════════════════════════════════════════
   Uses DS color tokens. Renders as a Next.js Link with button-like styling.
   ═══════════════════════════════════════════════════════════════════════════ */

type ArrowLinkVariant = "primary" | "teal" | "outline" | "text";
type ArrowLinkSize = "sm" | "md" | "lg";

export interface ArrowLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: ArrowLinkVariant;
  size?: ArrowLinkSize;
  fullWidth?: boolean;
  className?: string;
}

const variantStyles: Record<ArrowLinkVariant, string> = {
  primary:
    "bg-ds-primary text-ds-primary-foreground hover:bg-ds-primary-hover",
  teal:
    "bg-ds-teal text-ds-teal-foreground hover:bg-ds-teal-hover",
  outline:
    "border border-ds-border text-ds-text hover:border-ds-border-hover",
  text:
    "text-ds-teal-800 hover:text-ds-secondary",
};

const sizeStyles: Record<ArrowLinkSize, string> = {
  sm: "px-3 py-2 text-[0.625rem] md:px-4 md:py-2.5 md:text-xs",
  md: "px-4 py-3 text-xs md:px-5 md:py-3 md:text-sm",
  lg: "px-4 py-3 text-xs sm:px-6 sm:py-3.5 sm:text-sm lg:px-8 lg:py-4 lg:text-base font-semibold",
};

export function ArrowLink({
  href,
  children,
  variant = "primary",
  size = "sm",
  fullWidth = false,
  className,
}: ArrowLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 font-medium tracking-wide transition-colors duration-200 rounded-(--radius-button)",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? "w-full justify-between" : "w-fit justify-center",
        className,
      )}
    >
      <span>{children}</span>
      <span className="rtl:rotate-180 inline-block" aria-hidden="true">→</span>
    </Link>
  );
}
