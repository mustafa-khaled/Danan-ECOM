"use client";

import { createContext, useContext } from "react";
import type { DataTableContextValue } from "./types";

export const DataTableContext =
  createContext<DataTableContextValue | null>(null);

export function useDataTable<T = unknown>(): DataTableContextValue<T> {
  const ctx = useContext(DataTableContext) as DataTableContextValue<T> | null;
  if (!ctx) {
    throw new Error(
      "DataTable sub-components must be used inside <DataTable>",
    );
  }
  return ctx;
}
