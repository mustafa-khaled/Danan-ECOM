import Link from "next/link";

interface AdminPaginationProps {
  basePath: string;
  page: number;
  limit: number;
  total: number;
}

export function AdminPagination({ basePath, page, limit, total }: AdminPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (totalPages <= 1) {
    return null;
  }

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  function hrefFor(targetPage: number) {
    return targetPage === 1 ? basePath : `${basePath}?page=${targetPage}`;
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-border)] pt-4"
    >
      <p className="text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        {prevPage ? (
          <Link
            href={hrefFor(prevPage)}
            className="inline-flex min-h-11 items-center rounded-[var(--radius-item)] border border-[var(--color-border)] px-4 text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)] transition-colors hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
          >
            Previous
          </Link>
        ) : (
          <span className="inline-flex min-h-11 items-center rounded-[var(--radius-item)] border border-[var(--color-border)] px-4 text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)] opacity-40">
            Previous
          </span>
        )}
        {nextPage ? (
          <Link
            href={hrefFor(nextPage)}
            className="inline-flex min-h-11 items-center rounded-[var(--radius-item)] border border-[var(--color-border)] px-4 text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)] transition-colors hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
          >
            Next
          </Link>
        ) : (
          <span className="inline-flex min-h-11 items-center rounded-[var(--radius-item)] border border-[var(--color-border)] px-4 text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)] opacity-40">
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
