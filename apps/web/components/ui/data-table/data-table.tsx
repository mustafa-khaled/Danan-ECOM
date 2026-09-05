"use client";

import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { DataTableContext } from "./context";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTableHeader } from "./data-table-header";
import { DataTableBody } from "./data-table-body";
import {
  DataTableContainer,
  DataTableTable,
  DataTableBulkBar,
  DataTableEmpty,
  DataTableError,
} from "./data-table-parts";
import type { DataTableProps, DataTableContextValue } from "./types";

/* ═══════════════════════════════════════════════════════════════════════════
   DATA TABLE — Root / Provider
   ═══════════════════════════════════════════════════════════════════════════
   Compound component. Attach sub-components are mounted as static properties
   at the bottom of this file.

   Usage:
     <DataTable data={rows} columns={cols} keyExtractor={(r) => r.id}
       selectable showRowNumbers isLoading={loading}>

       <DataTable.Toolbar searchPlaceholder="Search…" onSearchChange={setQ} />
       <DataTable.Container>
         <DataTable.Table>
           <DataTable.Header onSort={handleSort} currentSort={sort} />
           <DataTable.Body />
         </DataTable.Table>
       </DataTable.Container>
       <DataTable.BulkBar>
         {(sel) => <Button variant="destructive">Delete {sel.size}</Button>}
       </DataTable.BulkBar>
     </DataTable>
   ═══════════════════════════════════════════════════════════════════════════ */

export function DataTable<T = unknown>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  isError = false,
  error = null,
  onRowClick,
  rowClassName,
  striped = false,
  hoverable = true,
  compact = false,
  bordered = false,
  selectable = false,
  onSelectionChange,
  showRowNumbers = false,
  className,
  children,
}: DataTableProps<T>) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    () => columns.map((c) => c.key),
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const allIds = useMemo(
    () => (selectable ? data.map((row, i) => keyExtractor(row, i)) : []),
     
    [data, keyExtractor, selectable],
  );

  const toggleRow = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        onSelectionChange?.(next);
        return next;
      });
    },
    [onSelectionChange],
  );

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const isEverySelected =
        allIds.length > 0 && allIds.every((id) => prev.has(id));
      const next = isEverySelected ? new Set<string>() : new Set(allIds);
      onSelectionChange?.(next);
      return next;
    });
  }, [allIds, onSelectionChange]);

  const isAllSelected =
    allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected;

  const contextValue: DataTableContextValue<T> = useMemo(
    () => ({
      data,
      columns,
      keyExtractor,
      visibleColumns,
      setVisibleColumns,
      isLoading,
      isError,
      error,
      onRowClick,
      rowClassName,
      striped,
      hoverable,
      compact,
      bordered,
      selectable,
      selectedIds,
      toggleRow,
      toggleAll,
      isAllSelected,
      isIndeterminate,
      showRowNumbers,
    }),
    [
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
      bordered,
      selectable,
      selectedIds,
      toggleRow,
      toggleAll,
      isAllSelected,
      isIndeterminate,
      showRowNumbers,
    ],
  );

  return (
    <DataTableContext.Provider
      value={contextValue as DataTableContextValue}
    >
      <div className={cn("w-full space-y-3", className)}>{children}</div>
    </DataTableContext.Provider>
  );
}

/* ── Static sub-component assignments ──────────────────────────────────── */

DataTable.Toolbar    = DataTableToolbar;
DataTable.Container  = DataTableContainer;
DataTable.Table      = DataTableTable;
DataTable.Header     = DataTableHeader;
DataTable.Body       = DataTableBody;
DataTable.BulkBar    = DataTableBulkBar;
DataTable.Empty      = DataTableEmpty;
DataTable.Error      = DataTableError;

/* ── Re-export for convenience ──────────────────────────────────────────── */
export type { DataTableProps, DataTableContextValue } from "./types";
