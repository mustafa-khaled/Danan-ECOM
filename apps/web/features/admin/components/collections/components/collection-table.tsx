"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DataTable } from "@/components/ui/data-table";
import { Pagination, PaginationSuspenseBoundary } from "@/components/ui/pagination";
import type { AdminCollectionListItem } from "@/features/admin/types";
import { ADMIN_PAGE_SIZE } from "@/shared/lib/parse-admin-page";
import { getCollectionColumns } from "./collection-columns";
import type { Locale } from "@/i18n/routing";

interface CollectionTableProps {
  items: AdminCollectionListItem[];
  total: number;
}

export default function CollectionTable({ items, total }: CollectionTableProps) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const columns = useMemo(() => getCollectionColumns(t, locale), [t, locale]);
  return (
    <div className="space-y-4">
      <DataTable
        data={items}
        columns={columns}
        keyExtractor={(row) => row.id}
        showRowNumbers
        hoverable
      >
        <DataTable.Container>
          <DataTable.Table>
            <DataTable.Header />
            <DataTable.Body
              emptyTitle={t("collections.emptyTitle")}
              emptyMessage={t("collections.emptyMessage")}
            />
          </DataTable.Table>
        </DataTable.Container>

        <DataTable.BulkBar>
          {(selected: Set<string>) => (
            <span className="text-xs font-body text-ds-text-secondary">
              {selected.size === 1
                ? t("collections.selected", { count: selected.size })
                : t("collections.selectedPlural", { count: selected.size })}
            </span>
          )}
        </DataTable.BulkBar>
      </DataTable>

      <PaginationSuspenseBoundary>
        <Pagination total={total} pageSize={ADMIN_PAGE_SIZE} showSummary />
      </PaginationSuspenseBoundary>
    </div>
  );
}
