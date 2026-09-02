/**
 * DataTable — compound component for rendering data tables.
 *
 * Split into focused files under data-table/:
 *   types.ts            — ColumnDef<T> + all prop interfaces
 *   context.tsx         — DataTableContext + useDataTable hook
 *   data-table.tsx      — root component / Provider
 *   data-table-toolbar  — search + column-visibility dropdown
 *   data-table-header   — <thead> with sort arrows
 *   data-table-body     — <tbody> auto-render, loading/error/empty states
 *   data-table-parts    — Container, Table, BulkBar, Empty, Error
 */
export {
  DataTable,
  useDataTable,
  type ColumnDef,
  type DataTableProps,
  type DataTableContextValue,
  type DataTableToolbarProps,
  type DataTableContainerProps,
  type DataTableTableProps,
  type DataTableHeaderProps,
  type DataTableBodyProps,
  type DataTableBulkBarProps,
  type DataTableEmptyProps,
  type DataTableErrorProps,
} from "./data-table/index";
