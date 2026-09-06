"use client";

import { DataTable } from "@/components/ui/data-table";
import { operationsColumns } from "./operations-columns";
import type { OperationItem } from "../types";

interface OperationsTableProps {
  items: OperationItem[];
  isLoading?: boolean;
}

export default function OperationsTable({
  items,
  isLoading = false,
}: OperationsTableProps) {
  return (
    <div className="space-y-4">
      <DataTable
        data={items}
        columns={operationsColumns}
        keyExtractor={(row) => row.id}
        hoverable
        isLoading={isLoading}
        showRowNumbers
      >
        <DataTable.Container>
          <DataTable.Table>
            <DataTable.Header />
            <DataTable.Body
              emptyTitle="No operations found"
              emptyMessage="No operations match the selected filters or search query."
            />
          </DataTable.Table>
        </DataTable.Container>
      </DataTable>
    </div>
  );
}
