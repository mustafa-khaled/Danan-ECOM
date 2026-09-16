"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DataTable } from "@/components/ui/data-table";
import { getOperationsColumns } from "./operations-columns";
import type { OperationItem } from "../types";
import type { Locale } from "@/i18n/routing";

interface OperationsTableProps {
  items: OperationItem[];
  isLoading?: boolean;
}

export default function OperationsTable({
  items,
  isLoading = false,
}: OperationsTableProps) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const columns = useMemo(() => getOperationsColumns(t, locale), [t, locale]);

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
              emptyTitle={t("operations.emptyFound")}
              emptyMessage={t("operations.emptyFoundMessage")}
            />
          </DataTable.Table>
        </DataTable.Container>
      </DataTable>
    </div>
  );
}
