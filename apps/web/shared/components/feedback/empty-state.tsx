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
        <a
          href={action.href}
          className="mt-8 inline-flex min-h-11 items-center rounded-[var(--radius-button)] border border-[var(--color-gold)] bg-transparent px-6 text-sm tracking-[0.1em] uppercase text-[var(--color-gold)] transition-colors hover:bg-[var(--color-gold)] hover:text-[var(--color-void)]"
        >
          {action.label}
        </a>
      ) : null}
    </div>
  );
}
