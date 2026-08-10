import { Badge, type BadgeVariant } from "./Badge";

/* ═══════════════════════════════════════════════════════════════════════════
   STATUS PILL — Maps status strings to DS Badge variants
   ═══════════════════════════════════════════════════════════════════════════ */

const statusToVariant: Record<string, BadgeVariant> = {
  INITIATED: "primary",
  "AWAITING RECIPIENT": "primary",
  "UNDER DADAN REVIEW": "warning",
  APPROVED: "success",
  REJECTED: "error",
  AVAILABLE: "success",
  OWNED: "info",
  PENDING: "warning",
};

export interface StatusPillProps {
  status: string;
  className?: string;
}

export function StatusPill({ status, className = "" }: StatusPillProps) {
  const variant = statusToVariant[status] ?? "outline";
  return (
    <Badge variant={variant} size="sm" className={className}>
      {status}
    </Badge>
  );
}
