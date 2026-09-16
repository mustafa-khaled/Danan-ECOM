"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { DataTable } from "@/components/ui/data-table";
import { getPaymentsColumns } from "./payments-columns";
import type { AdminPaymentListItem } from "../types";

interface PaymentsTableProps {
  items: AdminPaymentListItem[];
  isLoading?: boolean;
}

export default function PaymentsTable({
  items,
  isLoading = false,
}: PaymentsTableProps) {
  const t = useTranslations("admin");
  const columns = useMemo(() => getPaymentsColumns(t), [t]);

  return (
    <div className="space-y-4">
      <DataTable
        data={items}
        columns={columns}
        keyExtractor={(row) => row.id}
        hoverable
        isLoading={isLoading}
      >
        <DataTable.Container>
          <DataTable.Table>
            <DataTable.Header />
            <DataTable.Body
              emptyTitle={t("payments.emptyFound")}
              emptyMessage={t("payments.emptyFoundMessage")}
            />
          </DataTable.Table>
        </DataTable.Container>
      </DataTable>
    </div>
  );
}
