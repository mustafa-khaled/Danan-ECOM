"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DataTable } from "@/components/ui/data-table";
import { Pagination, PaginationSuspenseBoundary } from "@/components/ui/pagination";
import type { AdminClientListItem } from "@/features/admin/types";
import { ADMIN_PAGE_SIZE } from "@/shared/lib/parse-admin-page";
import { getCollectionAccessColumns } from "./collection-access-columns";
import type { Locale } from "@/i18n/routing";

interface CollectionAccessTableProps {
  items: AdminClientListItem[];
  total: number;
}

export default function CollectionAccessTable({
  items,
  total,
}: CollectionAccessTableProps) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const columns = useMemo(
    () => getCollectionAccessColumns(t, locale),
    [t, locale],
  );
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
              emptyTitle={t("members.emptyFound")}
              emptyMessage={t("members.emptyFoundMessage")}
            />
          </DataTable.Table>
        </DataTable.Container>

        <DataTable.BulkBar>
          {(selected: Set<string>) => (
            <span className="text-xs font-body text-ds-text-secondary">
              {t("common.selectedCount", { count: selected.size })}
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
