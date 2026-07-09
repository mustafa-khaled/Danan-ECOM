export interface ClientBadgeProps {
  name: string;
  className?: string;
}

export function ClientBadge({ name, className = "" }: ClientBadgeProps) {
  return (
    <span className={["inline-flex min-h-11 items-center rounded-[var(--radius-item)] border border-[var(--color-border)] px-4 text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]", className].filter(Boolean).join(" ")}>
      {name}
    </span>
  );
}
