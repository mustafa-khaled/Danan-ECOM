"use client";

import { DataTable } from "@/components/ui/data-table";
import { paymentsColumns } from "./payments-columns";
import type { AdminPaymentListItem } from "../types";

interface PaymentsTableProps {
  items: AdminPaymentListItem[];
  isLoading?: boolean;
}

export default function PaymentsTable({
  items,
  isLoading = false,
}: PaymentsTableProps) {
  return (
    <div className="space-y-4">
      <DataTable
        data={items}
        columns={paymentsColumns}
        keyExtractor={(row) => row.id}
        hoverable
        isLoading={isLoading}
      >
        <DataTable.Container>
          <DataTable.Table>
            <DataTable.Header />
            <DataTable.Body
              emptyTitle="No payments found"
              emptyMessage="No payments match the selected filters or search query."
            />
          </DataTable.Table>
        </DataTable.Container>
      </DataTable>
    </div>
  );
}
