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
      {/* Outer rotating metallic aura ring */}
      <div
        className={cn(
          "rounded-full border-2 border-gray-200/80 border-t-[#2D2321] border-r-[#4CBEAE] animate-spin duration-700",
          size === "sm" && "size-5 border",
          size === "md" && "size-24 sm:size-28",
          size === "lg" && "size-32 sm:size-36"
        )}
      />

      {/* Inner DADAN Geometric Triangle Emblem */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          className={cn(
            "text-[#2D2321] animate-pulse",
            size === "sm" && "size-2.5",
            size === "md" && "size-10 sm:size-12",
            size === "lg" && "size-14 sm:size-16"
          )}
          viewBox="0 0 40 40"
          fill="none"
        >
          <polygon
            points="20,4 36,36 4,36"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
            fill="none"
          />
          <line x1="20" y1="4" x2="20" y2="27" stroke="currentColor" strokeWidth="1.8" />
          <line x1="20" y1="27" x2="4" y2="36" stroke="currentColor" strokeWidth="1.8" />
          <line x1="20" y1="27" x2="36" y2="36" stroke="currentColor" strokeWidth="1.8" />
          <polygon
            points="20,13 27,27 13,27"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
          />
        </svg>
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
          ? "fixed inset-0 z-50 bg-white/95 backdrop-blur-md min-h-screen"
          : "min-h-[calc(100dvh-78px)] md:min-h-[calc(100dvh-115px)] w-full",
        className
      )}
    >
      <DadanSpinner size={size} />

      {/* ── Brand Label ── */}
      <div className="mt-6 flex flex-col items-center gap-1.5">
        <span
          className={cn(
            "font-display font-bold tracking-[0.3em] text-[#2D2321] uppercase",
            size === "sm" && "text-xs",
            size === "md" && "text-base sm:text-lg",
            size === "lg" && "text-xl sm:text-2xl"
          )}
        >
          DADAN
        </span>
        {label ? (
          <span className="font-sans text-xs tracking-widest text-gray-400 uppercase">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
