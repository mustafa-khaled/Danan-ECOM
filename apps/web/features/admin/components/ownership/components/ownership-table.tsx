"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DataTable } from "@/components/ui/data-table";
import { getOwnershipColumns } from "./ownership-columns";
import type { OwnershipRecordItem } from "../types";
import type { Locale } from "@/i18n/routing";

interface OwnershipTableProps {
  items: OwnershipRecordItem[];
  isLoading?: boolean;
}

export default function OwnershipTable({
  items,
  isLoading = false,
}: OwnershipTableProps) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const columns = useMemo(() => getOwnershipColumns(t, locale), [t, locale]);

  return (
    <div className="space-y-4">
      <DataTable
        data={items}
        columns={columns}
        keyExtractor={(row) => row.id}
        hoverable
        isLoading={isLoading}
        showRowNumbers
      >
        <DataTable.Container>
          <DataTable.Table>
            <DataTable.Header />
            <DataTable.Body
              emptyTitle={t("ownership.emptyFound")}
              emptyMessage={t("ownership.emptyFoundMessage")}
            />
          </DataTable.Table>
        </DataTable.Container>
      </DataTable>
    </div>
  );
}
