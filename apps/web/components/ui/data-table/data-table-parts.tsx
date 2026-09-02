"use client";

import { AlertCircle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDataTable } from "./context";
import type {
  DataTableContainerProps,
  DataTableTableProps,
  DataTableBulkBarProps,
  DataTableEmptyProps,
  DataTableErrorProps,
} from "./types";

/* ═══════════════════════════════════════════════════════════════════════════
   DATA TABLE PARTS
   Smaller structural pieces: Container, Table, BulkBar, Empty, Error.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Container — scrollable wrapper with design-system border ───────────── */

export function DataTableContainer({
  children,
  className,
  stickyHeader = false,
  maxHeight,
}: DataTableContainerProps) {
  return (
    <div
      className={cn(
        "w-full rounded-(--radius-md) border border-ds-border bg-ds-background overflow-hidden",
        stickyHeader && "overflow-y-auto",
        className,
      )}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

/* ── Table — <table> element ────────────────────────────────────────────── */

export function DataTableTable({ children, className }: DataTableTableProps) {
  const { bordered } = useDataTable();
  return (
    <table
      className={cn(
        "min-w-full text-left text-sm font-body",
        bordered && "border-collapse",
        className,
      )}
    >
      {children}
    </table>
  );
}

/* ── Bulk Action Bar ─────────────────────────────────────────────────────── */

export function DataTableBulkBar({ children, className }: DataTableBulkBarProps) {
  const { selectedIds } = useDataTable();
  if (selectedIds.size === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4",
        "rounded-(--radius-item) border border-(--color-gold)/40 bg-(--color-gold)/5",
        "px-4 py-2.5",
        className,
      )}
    >
      <span className="text-xs font-body font-semibold tracking-widest uppercase text-(--color-gold)">
        {selectedIds.size} selected
      </span>
      <div className="flex items-center gap-2">{children(selectedIds)}</div>
    </div>
  );
}

/* ── Standalone Empty State ──────────────────────────────────────────────── */

export function DataTableEmpty({
  title = "No results",
  message = "No records were found.",
  icon,
  action,
  className,
}: DataTableEmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 py-12 px-4 text-center",
        className,
      )}
    >
      {icon ?? <Inbox className="h-8 w-8 text-ds-text-muted opacity-60" />}
      <p className="text-sm font-body font-semibold text-ds-text">{title}</p>
      <p className="text-xs font-body text-ds-text-secondary">{message}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/* ── Standalone Error State ──────────────────────────────────────────────── */

export function DataTableError({
  title = "Failed to load data",
  message = "An unexpected error occurred.",
  onRetry,
  className,
}: DataTableErrorProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 py-12 px-4 text-center",
        className,
      )}
    >
      <AlertCircle className="h-8 w-8 text-ds-error opacity-70" />
      <p className="text-sm font-body font-semibold text-ds-text">{title}</p>
      <p className="text-xs font-body text-ds-text-secondary">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            "mt-1 inline-flex items-center gap-1.5 h-8 px-3",
            "text-xs font-body font-medium rounded-(--radius-item)",
            "border border-ds-border text-ds-text",
            "hover:border-(--color-gold) hover:text-(--color-gold) transition-colors",
          )}
        >
          Try again
        </button>
      )}
    </div>
  );
}
