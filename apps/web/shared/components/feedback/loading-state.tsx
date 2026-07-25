interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Loading" }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="relative h-10 w-10">
        <span className="absolute inset-0 rounded-[var(--radius-item)] border border-[var(--color-border)]" />
        <span className="absolute inset-0 animate-spin rounded-[var(--radius-item)] border border-transparent border-t-[var(--color-accent)]" />
      </div>
      <span className="mt-4 text-sm tracking-[0.2em] uppercase text-[var(--color-text-muted)]">
        {label}
      </span>
    </div>
  );
}
