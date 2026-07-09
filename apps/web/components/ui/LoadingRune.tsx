export interface LoadingRuneProps {
  label?: string;
  className?: string;
}

export function LoadingRune({ label = "Loading", className = "" }: LoadingRuneProps) {
  return (
    <div role="status" aria-live="polite" className={["flex flex-col items-center gap-4", className].filter(Boolean).join(" ")}>
      <div className="relative h-10 w-10">
        <span className="absolute inset-0 rounded-[var(--radius-item)] border border-[var(--color-gold)]/30" />
        <span className="absolute inset-0 animate-spin rounded-[var(--radius-item)] border border-transparent border-t-[var(--color-gold)]" />
      </div>
      <span className="font-display text-sm tracking-[0.2em] uppercase text-[var(--color-gold-light)]">{label}</span>
    </div>
  );
}
