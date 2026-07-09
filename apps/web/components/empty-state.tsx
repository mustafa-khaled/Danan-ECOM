import Link from "next/link";
import { LuxuryButton } from "@/components/ui";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { href: string; label: string };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-panel)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-16 text-center">
      <p className="font-display text-2xl text-[var(--color-ivory)]">{title}</p>
      {description ? (
        <p className="mt-3 max-w-md text-sm text-[var(--color-ivory-muted)]">{description}</p>
      ) : null}
      {action ? (
        <Link href={action.href} className="mt-8">
          <LuxuryButton>{action.label}</LuxuryButton>
        </Link>
      ) : null}
    </div>
  );
}
