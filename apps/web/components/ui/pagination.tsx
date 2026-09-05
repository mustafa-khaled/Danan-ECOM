"use client";

import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePagination } from "@/shared/lib/use-pagination";

/* ═══════════════════════════════════════════════════════════════════════════
   PAGINATION — URL Query-State Component
   ═══════════════════════════════════════════════════════════════════════════
   Page state lives entirely in the URL.
   Uses usePagination (useTransition) for isPending, then builds Link hrefs
   that update only the page param while preserving all other params.

   Quickstart (inside a Server Component):
     <Pagination total={total} pageSize={20} withSuspense />

   Or with explicit boundary:
     <PaginationSuspenseBoundary>
       <Pagination total={total} pageSize={20} />
     </PaginationSuspenseBoundary>
   ═══════════════════════════════════════════════════════════════════════════ */

export interface PaginationProps {
  total: number;
  pageSize: number;
  /** URL param name for the page (default: "page") */
  paramName?: string;
  /** Pages shown on each side of the current page (default: 1) */
  siblingCount?: number;
  /** Show "Page X of Y · N total" (default: true) */
  showSummary?: boolean;
  /** Show rows-per-page selector (default: false) */
  showPerPageSelector?: boolean;
  perPageOptions?: number[];
  /** Hide page-number buttons — show arrows only (default: false) */
  compact?: boolean;
  /** Scroll to top on navigation (default: true) */
  scrollToTop?: boolean;
  /** Wrap in a built-in Suspense boundary */
  withSuspense?: boolean;
  className?: string;
}

/* ── Shared style tokens ────────────────────────────────────────────────── */

const base =
  "inline-flex min-h-[35px] min-w-[39px] items-center justify-center rounded-[8px] " +
  "border border-[#F4F4F4] text-xs font-body font-medium tracking-widest " +
  "uppercase transition-colors select-none";

const active = "border-(--color-gold) bg-(--color-gold) text-white";
const enabled =
  "text-ds-text-secondary hover:border-(--color-gold) hover:text-(--color-gold)";
const disabled = "pointer-events-none opacity-35 text-ds-text-muted";

/* ── Inner component (requires Suspense ancestor) ───────────────────────── */

function PaginationInner({
  total,
  pageSize,
  paramName = "page",
  siblingCount = 1,
  showSummary = true,
  showPerPageSelector = false,
  perPageOptions = [10, 20, 50, 100],
  compact = false,
  scrollToTop = true,
  className,
}: Omit<PaginationProps, "withSuspense">) {
  const { isPending, buildPageUrl, setPerPage, getPageInfo, params } =
    usePagination({ paramName, scrollToTop, siblingCount });

  const { from, to, totalPages, hasNextPage, hasPrevPage, pageNumbers } =
    getPageInfo(total, pageSize);

  const current = params.page;

  if (totalPages <= 1 && !showPerPageSelector) return null;

  const navLink = (
    page: number,
    ariaLabel: string,
    icon: ReactNode,
    isDisabled: boolean,
  ) => {
    const cls = cn(base, isDisabled ? disabled : enabled, "px-2");
    if (isDisabled) {
      return (
        <span className={cls} aria-label={ariaLabel} aria-disabled="true">
          {icon}
        </span>
      );
    }
    return (
      <Link
        href={buildPageUrl(page)}
        aria-label={ariaLabel}
        className={cn(cls, isPending && "opacity-50 pointer-events-none")}
        aria-disabled={isPending || undefined}
      >
        {icon}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-col sm:flex-row pt-4 flex-wrap items-center justify-between gap-3",
        className,
      )}
    >
      {/* Summary */}
      {showSummary && (
        <p className="text-xs text-[14px] order-2 sm:order-1">
          {total === 0 ? "No results" : `Showing ${from}–${to} of ${total}`}
          {totalPages > 1 && ` · Page ${current} of ${totalPages}`}
        </p>
      )}

      <div className="flex items-center gap-3 order-1 sm:order-2">
        {/* Per-page selector */}
        {showPerPageSelector && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs tracking-widest uppercase text-ds-text-secondary hidden sm:inline">
              Rows
            </span>
            <select
              value={params.per_page}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setPerPage(Number(e.target.value))
              }
              disabled={isPending}
              className={cn(
                "h-9 px-2 rounded-(--radius-item) border border-ds-border bg-ds-background",
                "text-xs font-body text-ds-text cursor-pointer",
                "focus:outline-none focus:border-(--color-gold) transition-colors",
                isPending && "opacity-50",
              )}
            >
              {perPageOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {/* « First */}
            {navLink(
              1,
              "First page",
              <ChevronsLeft className="h-3.5 w-3.5" />,
              !hasPrevPage,
            )}

            {/* ‹ Previous */}
            {navLink(
              current - 1,
              "Previous page",
              <ChevronLeft className="h-3.5 w-3.5" />,
              !hasPrevPage,
            )}

            {/* Page number buttons */}
            {!compact && (
              <div className="hidden sm:flex items-center gap-1">
                {/* First page anchor */}
                {pageNumbers.length > 0 && pageNumbers[0]! > 1 && (
                  <>
                    {current === 1 ? (
                      <span
                        className={cn(base, active, "px-2.5")}
                        aria-current="page"
                      >
                        1
                      </span>
                    ) : (
                      <Link
                        href={buildPageUrl(1)}
                        className={cn(
                          base,
                          enabled,
                          "px-2.5",
                          isPending && "opacity-50 pointer-events-none",
                        )}
                        aria-label="Page 1"
                      >
                        1
                      </Link>
                    )}
                    {pageNumbers[0]! > 2 && (
                      <span
                        className={cn(
                          base,
                          disabled,
                          "px-2 border-transparent",
                        )}
                        aria-hidden="true"
                      >
                        …
                      </span>
                    )}
                  </>
                )}

                {/* Sibling window */}
                {pageNumbers.map((p) =>
                  p === current ? (
                    <span
                      key={p}
                      className={cn(base, active, "px-2.5")}
                      aria-current="page"
                    >
                      {p}
                    </span>
                  ) : (
                    <Link
                      key={p}
                      href={buildPageUrl(p)}
                      className={cn(
                        base,
                        enabled,
                        "px-2.5",
                        isPending && "opacity-50 pointer-events-none",
                      )}
                      aria-label={`Page ${p}`}
                    >
                      {p}
                    </Link>
                  ),
                )}

                {/* Last page anchor */}
                {pageNumbers.length > 0 &&
                  pageNumbers[pageNumbers.length - 1]! < totalPages && (
                    <>
                      {pageNumbers[pageNumbers.length - 1]! <
                        totalPages - 1 && (
                        <span
                          className={cn(
                            base,
                            disabled,
                            "px-2 border-transparent",
                          )}
                          aria-hidden="true"
                        >
                          …
                        </span>
                      )}
                      {current === totalPages ? (
                        <span
                          className={cn(base, active, "px-2.5")}
                          aria-current="page"
                        >
                          {totalPages}
                        </span>
                      ) : (
                        <Link
                          href={buildPageUrl(totalPages)}
                          className={cn(
                            base,
                            enabled,
                            "px-2.5",
                            isPending && "opacity-50 pointer-events-none",
                          )}
                          aria-label={`Page ${totalPages}`}
                        >
                          {totalPages}
                        </Link>
                      )}
                    </>
                  )}

                {/* Edge case: only 1 page in total */}
                {pageNumbers.length === 0 && (
                  <span
                    className={cn(base, active, "px-2.5")}
                    aria-current="page"
                  >
                    {current}
                  </span>
                )}
              </div>
            )}

            {/* Compact: show current/total */}
            {compact && (
              <span className="px-2 text-xs font-body text-ds-text-secondary tabular-nums">
                {current} / {totalPages}
              </span>
            )}

            {/* › Next */}
            {navLink(
              current + 1,
              "Next page",
              <ChevronRight className="h-3.5 w-3.5" />,
              !hasNextPage,
            )}

            {/* » Last */}
            {navLink(
              totalPages,
              "Last page",
              <ChevronsRight className="h-3.5 w-3.5" />,
              !hasNextPage,
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

/* ── Public export ──────────────────────────────────────────────────────── */

export function Pagination({
  withSuspense = false,
  ...props
}: PaginationProps) {
  const inner = <PaginationInner {...props} />;
  return withSuspense ? (
    <Suspense fallback={<PaginationSkeleton />}>{inner}</Suspense>
  ) : (
    inner
  );
}

export function PaginationSuspenseBoundary({
  children,
}: {
  children: ReactNode;
}) {
  return <Suspense fallback={<PaginationSkeleton />}>{children}</Suspense>;
}

function PaginationSkeleton() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ds-border pt-4 animate-pulse">
      <div className="h-3 w-40 rounded bg-ds-surface" />
      <div className="flex gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-9 rounded-(--radius-item) bg-ds-surface"
          />
        ))}
      </div>
    </div>
  );
}
