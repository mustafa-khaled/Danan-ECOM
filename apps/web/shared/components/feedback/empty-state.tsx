import Link from "next/link";
import { Button } from "@/components/ui/Button";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { href: string; label: string };
}

export function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-ds-border bg-ds-surface px-6 py-16 text-center">
      <p className="font-heading text-2xl font-bold text-ds-text">
        {title}
      </p>
      {description ? (
        <p className="mt-3 max-w-md text-sm text-ds-text-secondary font-body">
          {description}
        </p>
      ) : null}
      {action ? (
        <div className="mt-6">
          <Link href={action.href}>
            <Button variant="primary" size="md">
              {action.label}
            </Button>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
