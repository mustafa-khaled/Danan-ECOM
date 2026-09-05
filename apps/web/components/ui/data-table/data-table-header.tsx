"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useDataTable } from "./context";
import type { DataTableHeaderProps } from "./types";

/* ═══════════════════════════════════════════════════════════════════════════
   DATA TABLE HEADER — <thead>
   Renders column headers from context.
   Prepends select-all and row-number columns when configured.
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
        "bg-[#F1F2F3] text-sm font-semibold text-ds-text",
        sticky && "sticky top-0 z-10",
        className,
      )}
    >
      <tr className="h-15">
        {/* Select-all checkbox column */}
        {selectable && (
          <th
            className="h-15 min-w-15 w-15 px-4 text-left align-middle font-semibold"
            aria-label="Select all"
          >
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
          <th
            className="h-15 min-w-15 w-15 px-4 text-left align-middle font-semibold text-ds-text-secondary"
            aria-label="#"
          >
            No.
          </th>
        )}

        {/* Data columns */}
        {visibleCols.map((col) => {
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
                "h-15 min-w-15 px-4 align-middle font-semibold",
                alignClass,
                col.sortable && "cursor-pointer select-none",
                col.headerClassName,
              )}
              style={{
                width: col.width,
                minWidth: col.minWidth ?? "60px",
              }}
              onClick={() => col.sortable && handleSort(col.key)}
            >
              <span>{col.label}</span>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
