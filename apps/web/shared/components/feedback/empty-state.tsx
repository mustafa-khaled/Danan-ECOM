import Link from "next/link";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { href: string; label: string };
  variant?: "dark" | "light";
}

export function EmptyState({
  title,
  description,
  action,
  variant = "light",
}: EmptyStateProps) {
  const isLight = variant === "light";

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-[var(--radius-panel)] border border-dashed px-6 py-16 text-center ${
        isLight
          ? "border-[var(--color-border)] bg-[var(--color-surface)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)]"
      }`}
    >
      <p
        className={`font-display text-2xl ${
          isLight ? "text-[var(--color-text)]" : "text-[var(--color-ivory)]"
        }`}
      >
        {title}
      </p>
      {description ? (
        <p
          className={`mt-3 max-w-md text-sm ${
            isLight ? "text-[var(--color-text-muted)]" : "text-[var(--color-ivory-muted)]"
          }`}
        >
          {description}
        </p>
      ) : null}
      {action ? (
        <Link
          href={action.href}
          className={`mt-8 inline-flex min-h-11 items-center rounded-[var(--radius-button)] px-6 text-sm tracking-[0.1em] uppercase transition-colors ${
            isLight
              ? "border border-[var(--color-accent)] bg-[var(--color-accent)] text-white hover:bg-transparent hover:text-[var(--color-accent)]"
              : "border border-[var(--color-gold)] bg-transparent text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-[var(--color-void)]"
          }`}
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
