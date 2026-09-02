"use client";

import { AlertCircle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDataTable } from "./context";
import type { DataTableBodyProps } from "./types";

/* ═══════════════════════════════════════════════════════════════════════════
   DATA TABLE BODY — <tbody>
   Auto-rendering logic:
     isLoading  → skeleton rows
     isError    → error message + optional retry
     empty data → empty state
     else       → map data rows using ColumnDef accessor/render
                  + optional select checkbox column (prepended)
                  + optional row-number column (prepended after checkbox)
   ═══════════════════════════════════════════════════════════════════════════ */

export function DataTableBody({
  emptyTitle = "No results",
  emptyMessage = "No records were found.",
  emptyIcon,
  emptyAction,
  loadingRows = 5,
  onRetry,
  className,
}: DataTableBodyProps) {
  const {
    data,
    columns,
    keyExtractor,
    visibleColumns,
    isLoading,
    isError,
    error,
    onRowClick,
    rowClassName,
    striped,
    hoverable,
    compact,
    selectable,
    selectedIds,
    toggleRow,
    showRowNumbers,
  } = useDataTable();

  const visibleCols = columns.filter((c) => visibleColumns.includes(c.key));

  /* total column count (data + optional leading columns) */
  const totalCols =
    visibleCols.length +
    (selectable ? 1 : 0) +
    (showRowNumbers ? 1 : 0);

  const cellPad = compact ? "px-3 py-2" : "px-4 py-4";

  /* ── Loading — skeleton rows ─────────────────────────────────────────── */
  if (isLoading) {
    return (
      <tbody className={cn("divide-y divide-ds-border", className)}>
        {Array.from({ length: loadingRows }).map((_, ri) => (
          <tr key={`skeleton-${ri}`}>
            {Array.from({ length: totalCols }).map((__, ci) => (
              <td key={ci} className={cn(cellPad)}>
                <div className="h-4 w-full rounded bg-ds-surface animate-pulse" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  }

  /* ── Error state ─────────────────────────────────────────────────────── */
  if (isError) {
    return (
      <tbody className={className}>
        <tr>
          <td colSpan={totalCols} className="px-4 py-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle className="h-8 w-8 text-ds-error opacity-70" />
              <p className="text-sm font-body font-semibold text-ds-text">
                Failed to load data
              </p>
              <p className="text-xs font-body text-ds-text-secondary">
                {error?.message ?? "An unexpected error occurred."}
              </p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className={cn(
                    "mt-1 inline-flex items-center gap-1.5 h-8 px-3 text-xs font-body font-medium",
                    "rounded-(--radius-item) border border-ds-border text-ds-text",
                    "hover:border-(--color-gold) hover:text-(--color-gold) transition-colors",
                  )}
                >
                  Try again
                </button>
              )}
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  /* ── Empty state ─────────────────────────────────────────────────────── */
  if (!data || data.length === 0) {
    return (
      <tbody className={className}>
        <tr>
          <td colSpan={totalCols} className="px-4 py-12">
            <div className="flex flex-col items-center gap-3 text-center">
              {emptyIcon ?? (
                <Inbox className="h-8 w-8 text-ds-text-muted opacity-60" />
              )}
              <p className="text-sm font-body font-semibold text-ds-text">
                {emptyTitle}
              </p>
              <p className="text-xs font-body text-ds-text-secondary">
                {emptyMessage}
              </p>
              {emptyAction && <div className="mt-1">{emptyAction}</div>}
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  /* ── Data rows ───────────────────────────────────────────────────────── */
  return (
    <tbody className={cn("divide-y divide-ds-border", className)}>
      {data.map((row, rowIndex) => {
        const key = keyExtractor(row, rowIndex);
        const isSelected = selectable && selectedIds.has(key);
        const isClickable = !!onRowClick;

        const computedRowClass =
          typeof rowClassName === "function"
            ? rowClassName(row, rowIndex)
            : rowClassName;

        return (
          <tr
            key={key}
            onClick={isClickable ? () => onRowClick(row, rowIndex) : undefined}
            className={cn(
              "transition-colors",
              striped && rowIndex % 2 === 1 && "bg-ds-surface/40",
              hoverable && !isSelected && "hover:bg-ds-surface/50",
              isSelected && "bg-(--color-gold)/8",
              isClickable && "cursor-pointer",
              computedRowClass,
            )}
          >
            {/* Select checkbox */}
            {selectable && (
              <td className={cn(cellPad, "w-10")}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleRow(key)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select row ${key}`}
                  className="h-4 w-4 cursor-pointer accent-(--color-gold)"
                />
              </td>
            )}

            {/* Row number */}
            {showRowNumbers && (
              <td
                className={cn(
                  cellPad,
                  "w-12 text-xs text-ds-text-secondary tabular-nums select-none",
                )}
              >
                {rowIndex + 1}
              </td>
            )}

            {/* Data cells */}
            {visibleCols.map((col) => {
              let cellContent: React.ReactNode;

              if (col.render) {
                const value =
                  typeof col.accessor === "function"
                    ? col.accessor(row)
                    : col.accessor != null
                      ? (row as Record<string, unknown>)[col.accessor as string]
                      : undefined;
                cellContent = col.render(value, row, rowIndex);
              } else if (col.accessor) {
                cellContent = (
                  typeof col.accessor === "function"
                    ? col.accessor(row)
                    : (row as Record<string, unknown>)[col.accessor as string]
                ) as React.ReactNode;
              }

              const alignClass =
                col.align === "right"
                  ? "text-right"
                  : col.align === "center"
                    ? "text-center"
                    : "text-left";

              return (
                <td
                  key={col.key}
                  className={cn(
                    cellPad,
                    "text-ds-text align-middle",
                    alignClass,
                    col.cellClassName,
                  )}
                >
                  {cellContent}
                </td>
              );
            })}
          </tr>
        );
      })}
    </tbody>
  );
}
