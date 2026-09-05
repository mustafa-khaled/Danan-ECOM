import type { Dispatch, ReactNode, SetStateAction } from "react";

/* ── Column definition ──────────────────────────────────────────────────── */

export interface ColumnDef<T = unknown> {
  /** Unique identifier — used as React key and for column-visibility toggle */
  key: string;
  /** Header cell content */
  label: ReactNode;
  /** Field accessor: a key of T or a function that returns the cell value */
  accessor?: keyof T | ((row: T) => unknown);
  /** Custom cell renderer — receives the raw value, the full row, and its index */
  render?: (value: unknown, row: T, index: number) => ReactNode;
  /** Allow this column to be sorted */
  sortable?: boolean;
  /** CSS width (e.g. "120px", "15%") */
  width?: string;
  /** Minimum CSS width (defaults to "60px") */
  minWidth?: string;
  /** Horizontal alignment of both header and cell */
  align?: "left" | "center" | "right";
  /** Extra className applied to the <th> */
  headerClassName?: string;
  /** Extra className applied to every <td> in this column */
  cellClassName?: string;
  /**
   * Whether the column appears in the column-visibility toggle.
   * Set to false for fixed columns (e.g. "actions"). Default: true.
   */
  hideable?: boolean;
}

/* ── Root component props ───────────────────────────────────────────────── */

export interface DataTableProps<T = unknown> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (row: T, index: number) => string;
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: string | ((row: T, index: number) => string);
  /** Alternating row shading */
  striped?: boolean;
  /** Row hover highlight (default: true) */
  hoverable?: boolean;
  /** Compact vertical padding (default: false) */
  compact?: boolean;
  /** Collapse cell borders */
  bordered?: boolean;
  /** Prepend a checkbox column for multi-row selection */
  selectable?: boolean;
  onSelectionChange?: (ids: Set<string>) => void;
  /** Prepend a sequential row-number column */
  showRowNumbers?: boolean;
  className?: string;
  children?: ReactNode;
}

/* ── Context ────────────────────────────────────────────────────────────── */

export interface DataTableContextValue<T = unknown> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (row: T, index: number) => string;
  visibleColumns: string[];
  setVisibleColumns: Dispatch<SetStateAction<string[]>>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: string | ((row: T, index: number) => string);
  striped: boolean;
  hoverable: boolean;
  compact: boolean;
  bordered: boolean;
  selectable: boolean;
  selectedIds: Set<string>;
  toggleRow: (id: string) => void;
  toggleAll: () => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  showRowNumbers: boolean;
  currentSort?: { column: string; direction: "asc" | "desc" };
}

/* ── Sub-component prop interfaces ──────────────────────────────────────── */

export interface DataTableToolbarProps {
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  /** Show the column-visibility dropdown (default: true) */
  showColumnToggle?: boolean;
  /** Extra content rendered on the right side (e.g. an "Add" button) */
  actions?: ReactNode;
  /** Debounce delay in ms for the search input (default: 300) */
  searchDebounce?: number;
  className?: string;
}

export interface DataTableContainerProps {
  children: ReactNode;
  className?: string;
  /** Make the header sticky inside a scrollable container */
  stickyHeader?: boolean;
  /** max-height CSS value for vertical scroll */
  maxHeight?: string;
}

export interface DataTableTableProps {
  children: ReactNode;
  className?: string;
}

export interface DataTableHeaderProps {
  onSort?: (column: string, direction: "asc" | "desc") => void;
  currentSort?: { column: string; direction: "asc" | "desc" };
  sticky?: boolean;
  className?: string;
}

export interface DataTableBodyProps {
  /** Custom empty state — replaces the default empty message */
  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  emptyAction?: ReactNode;
  /** Number of skeleton rows to show while loading */
  loadingRows?: number;
  /** Called when the user clicks "Try again" in the error state */
  onRetry?: () => void;
  className?: string;
}

export interface DataTableBulkBarProps {
  children: (selectedIds: Set<string>) => ReactNode;
  className?: string;
}

export interface DataTableEmptyProps {
  title?: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export interface DataTableErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}
