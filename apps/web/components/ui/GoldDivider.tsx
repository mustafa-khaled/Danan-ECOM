export interface GoldDividerProps {
  className?: string;
}

export function GoldDivider({ className = "" }: GoldDividerProps) {
  return <hr aria-hidden="true" className={["border-0 border-t border-(--color-gold)/25", className].filter(Boolean).join(" ")} />;
}
