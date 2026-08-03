import Link from "next/link";
import { cn } from "@/lib/utils";

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
    "bg-[#B56B5D] text-white hover:bg-[#a05c50]",
  teal:
    "bg-[#4CBEAE] text-white hover:bg-[#3FA899]",
  outline:
    "border border-(--color-border) text-(--color-text) hover:border-(--color-accent) hover:text-(--color-accent)",
  text:
    "text-[#1F5750] hover:text-(--color-accent)",
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
        "inline-flex items-center gap-2 font-medium tracking-wide transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? "w-full justify-between" : "w-fit justify-center",
        className,
      )}
    >
      <span>{children}</span>
      <span className="rtl:rotate-180 inline-block">→</span>
    </Link>
  );
}
