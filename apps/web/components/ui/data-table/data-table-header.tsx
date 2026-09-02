"use client";

import { useRef } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDataTable } from "./context";
import type { DataTableHeaderProps } from "./types";

/* ═══════════════════════════════════════════════════════════════════════════
   DATA TABLE HEADER — <thead>
   Renders column headers from context. Handles sort arrows and
   optional sticky positioning. Prepends select-all and row-number
   columns when the table is configured for them.
   ═══════════════════════════════════════════════════════════════════════════ */

export function DataTableHeader({
  onSort,
  currentSort,
  sticky = false,
  className,
}: DataTableHeaderProps) {
  const {
    columns,
    visibleColumns,
    compact,
    selectable,
    showRowNumbers,
    toggleAll,
    isAllSelected,
    isIndeterminate,
  } = useDataTable();

  const checkboxRef = useRef<HTMLInputElement>(null);

  /* imperatively set indeterminate — not available as a React prop */
  if (checkboxRef.current) {
    checkboxRef.current.indeterminate = isIndeterminate;
  }

  const visibleCols = columns.filter((c) => visibleColumns.includes(c.key));
  const pad = compact ? "px-3 py-2" : "px-4 py-3";

  const handleSort = (key: string) => {
    if (!onSort) return;
    const dir =
      currentSort?.column === key && currentSort.direction === "asc"
        ? "desc"
        : "asc";
    onSort(key, dir);
  };

  return (
    <thead
      className={cn(
        "border-b border-ds-border text-xs tracking-widest uppercase",
        "text-ds-text-secondary bg-ds-surface",
        sticky && "sticky top-0 z-10 backdrop-blur-sm",
        className,
      )}
    >
      <tr>
        {/* Select-all checkbox column */}
        {selectable && (
          <th className={cn(pad, "w-10")} aria-label="Select all">
            <input
              ref={checkboxRef}
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleAll}
              className="h-4 w-4 cursor-pointer accent-(--color-gold)"
            />
          </th>
        )}

        {/* Row number column */}
        {showRowNumbers && (
          <th className={cn(pad, "w-12 text-ds-text-secondary")} aria-label="#">
            #
          </th>
        )}

        {/* Data columns */}
        {visibleCols.map((col) => {
          const isSorted = currentSort?.column === col.key;
          const dir = isSorted ? currentSort!.direction : null;
          const alignClass =
            col.align === "right"
              ? "text-right"
              : col.align === "center"
                ? "text-center"
                : "text-left";

          return (
            <th
              key={col.key}
              className={cn(
                pad,
                "font-semibold",
                alignClass,
                col.sortable && "cursor-pointer select-none",
                col.headerClassName,
              )}
              style={{ width: col.width }}
              onClick={() => col.sortable && handleSort(col.key)}
            >
              <div
                className={cn(
                  "inline-flex items-center gap-1.5",
                  col.align === "right" && "flex-row-reverse",
                  col.align === "center" && "justify-center",
                )}
              >
                <span>{col.label}</span>
                {col.sortable && (
                  <span className="shrink-0 text-ds-text-secondary">
                    {!isSorted && <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    {isSorted && dir === "asc" && (
                      <ArrowUp className="h-3 w-3 text-(--color-gold)" />
                    )}
                    {isSorted && dir === "desc" && (
                      <ArrowDown className="h-3 w-3 text-(--color-gold)" />
                    )}
                  </span>
                )}
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
