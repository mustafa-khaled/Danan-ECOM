import Image from "next/image";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  label?: string;
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function DadanSpinner({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      {/* Outer rotating aura ring */}
      <div
        className={cn(
          "rounded-full border-2 border-ds-border/60 border-t-ds-secondary border-r-ds-teal animate-spin duration-700",
          size === "sm" && "size-5 border",
          size === "md" && "size-24 sm:size-28",
          size === "lg" && "size-32 sm:size-36"
        )}
      />

      {/* Inner DADAN Logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Image
          src="/assets/dadan-logo.png"
          alt="DADAN"
          width={246}
          height={40}
          className={cn(
            "invert object-contain",
            size === "sm" && "w-8",
            size === "md" && "w-14 sm:w-16",
            size === "lg" && "w-20 sm:w-24"
          )}
          priority
        />
      </div>
    </div>
  );
}

export function LoadingState({
  label,
  fullScreen = false,
  size = "md",
  className = "",
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-6 transition-all duration-300",
        fullScreen
          ? "fixed inset-0 z-50 bg-ds-background/95 backdrop-blur-md min-h-screen"
          : "min-h-[calc(100dvh-78px)] md:min-h-[calc(100dvh-115px)] w-full",
        className
      )}
    >
      <DadanSpinner size={size} />

      {/* ── Optional Loading Label ── */}
      {label ? (
        <div className="mt-6 flex flex-col items-center gap-1.5">
          <span className="font-body text-xs tracking-widest text-ds-text-secondary uppercase">
            {label}
          </span>
        </div>
      ) : null}
    </div>
  );
}
