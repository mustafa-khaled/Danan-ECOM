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
      className={`flex flex-col items-center justify-center rounded-(--radius-panel) border border-dashed px-6 py-16 text-center ${
        isLight
          ? "border-border bg-(--color-surface)"
          : "border-border bg-(--color-surface)"
      }`}
    >
      <p
        className={`font-display text-2xl ${
          isLight ? "text-(--color-text)" : "text-(--color-ivory)"
        }`}
      >
        {title}
      </p>
      {description ? (
        <p
          className={`mt-3 max-w-md text-sm ${
            isLight ? "text-(--color-text-muted)" : "text-(--color-ivory-muted)"
          }`}
        >
          {description}
        </p>
      ) : null}
      {action ? (
        <Link
          href={action.href}
          className={`mt-8 inline-flex min-h-11 items-center rounded-(--radius-button) px-6 text-sm tracking-widest uppercase transition-colors ${
            isLight
              ? "border border-(--color-accent) bg-(--color-accent) text-white hover:bg-transparent hover:text-(--color-accent)"
              : "border border-(--color-gold) bg-transparent text-(--color-gold) hover:bg-(--color-gold) hover:text-void"
          }`}
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
