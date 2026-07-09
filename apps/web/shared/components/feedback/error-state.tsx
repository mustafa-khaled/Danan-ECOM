interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-panel)] border border-[var(--color-ruby)]/30 bg-[var(--color-surface)] px-6 py-16 text-center">
      <p className="font-display text-2xl text-[var(--color-ruby)]">{title}</p>
      {message ? (
        <p className="mt-3 max-w-md text-sm text-[var(--color-ivory-muted)]">{message}</p>
      ) : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-8 inline-flex min-h-11 items-center rounded-[var(--radius-button)] border border-[var(--color-gold)] bg-transparent px-6 text-sm tracking-[0.1em] uppercase text-[var(--color-gold)] transition-colors hover:bg-[var(--color-gold)] hover:text-[var(--color-void)]"
        >
          Try Again
        </button>
      ) : null}
    </div>
  );
}
