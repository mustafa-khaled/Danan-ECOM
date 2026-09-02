"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, ChevronDown, Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDataTable } from "./context";
import type { DataTableToolbarProps } from "./types";

/* ═══════════════════════════════════════════════════════════════════════════
   DATA TABLE TOOLBAR
   Search input (debounced) + column-visibility dropdown
   ═══════════════════════════════════════════════════════════════════════════ */

export function DataTableToolbar({
  onSearchChange,
  searchPlaceholder = "Search…",
  searchValue: externalValue,
  showColumnToggle = true,
  actions,
  searchDebounce = 300,
  className,
}: DataTableToolbarProps) {
  const { columns, visibleColumns, setVisibleColumns } = useDataTable();

  const [search, setSearch] = useState(externalValue ?? "");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* sync external value */
  useEffect(() => {
    if (externalValue !== undefined) setSearch(externalValue);
  }, [externalValue]);

  /* close dropdown on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* cleanup timer on unmount */
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onSearchChange?.(value), searchDebounce);
    },
    [onSearchChange, searchDebounce],
  );

  const clearSearch = useCallback(() => {
    setSearch("");
    clearTimeout(timerRef.current);
    onSearchChange?.("");
  }, [onSearchChange]);

  const toggleColumn = useCallback((key: string) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }, [setVisibleColumns]);

  const hideableColumns = columns.filter((c) => c.hideable !== false);

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-stretch sm:items-center gap-3",
        "p-3 rounded-(--radius-md) border border-ds-border bg-ds-surface",
        className,
      )}
    >
      {/* Search */}
      {onSearchChange && (
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ds-text-secondary pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              "w-full h-9 pl-9 pr-8 rounded-(--radius-item) border border-ds-border bg-ds-background",
              "text-sm font-body text-ds-text placeholder:text-ds-text-muted",
              "outline-none focus:border-(--color-gold) transition-colors",
            )}
          />
          {search && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-ds-text-secondary hover:text-ds-text"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Right side: actions + column toggle */}
      <div className="flex items-center gap-2 sm:ml-auto">
        {actions}

        {showColumnToggle && hideableColumns.length > 0 && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen((p) => !p)}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3 rounded-(--radius-item)",
                "border border-ds-border bg-ds-background text-xs font-body",
                "text-ds-text-secondary hover:border-(--color-gold) hover:text-(--color-gold)",
                "transition-colors uppercase tracking-widest",
              )}
            >
              <Columns3 className="h-3.5 w-3.5" />
              Columns
              <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-ds-surface text-[10px] text-ds-text">
                {visibleColumns.length}
              </span>
              <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
            </button>

            {open && (
              <div
                className={cn(
                  "absolute right-0 top-full mt-1 z-50 min-w-44",
                  "rounded-(--radius-md) border border-ds-border bg-ds-background shadow-lg py-1",
                )}
              >
                {hideableColumns.map((col) => {
                  const isVisible = visibleColumns.includes(col.key);
                  return (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => toggleColumn(col.key)}
                      className={cn(
                        "flex items-center w-full gap-2 px-3 py-2 text-sm font-body text-left",
                        "hover:bg-ds-surface transition-colors",
                        isVisible ? "text-ds-text" : "text-ds-text-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "flex-none h-3.5 w-3.5 rounded-sm border transition-colors",
                          isVisible
                            ? "border-(--color-gold) bg-(--color-gold)"
                            : "border-ds-border bg-transparent",
                        )}
                      />
                      {col.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
