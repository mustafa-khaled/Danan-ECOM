export interface SerialBadgeProps {
  serial: string;
  className?: string;
}

export function SerialBadge({ serial, className = "" }: SerialBadgeProps) {
  return (
    <span className={["inline-block font-mono text-xs tracking-[0.18em] uppercase text-gold-light", className].filter(Boolean).join(" ")}>
      {serial}
    </span>
  );
}
