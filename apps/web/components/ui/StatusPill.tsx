const statusStyles: Record<string, string> = {
  INITIATED: "border-[var(--color-gold)]/40 text-[var(--color-gold-light)]",
  "AWAITING RECIPIENT": "border-[var(--color-gold)]/40 text-[var(--color-gold-light)]",
  "UNDER DADAN REVIEW": "border-[var(--color-warning)]/50 text-[var(--color-warning)]",
  APPROVED: "border-[var(--color-emerald)]/50 text-[var(--color-emerald)]",
  REJECTED: "border-[var(--color-ruby)]/50 text-[var(--color-ruby)]",
  AVAILABLE: "border-[var(--color-emerald)]/50 text-[var(--color-emerald)]",
  OWNED: "border-[var(--color-gold)]/40 text-[var(--color-gold-light)]",
  PENDING: "border-[var(--color-warning)]/50 text-[var(--color-warning)]",
};

export interface StatusPillProps {
  status: string;
  className?: string;
}

export function StatusPill({ status, className = "" }: StatusPillProps) {
  const style = statusStyles[status] ?? "border-[var(--color-border)] text-[var(--color-ivory-muted)]";
  return (
    <span className={["inline-block rounded-[var(--radius-item)] border px-3 py-1 font-mono text-[10px] tracking-[0.12em] uppercase", style, className].filter(Boolean).join(" ")}>
      {status}
    </span>
  );
}
