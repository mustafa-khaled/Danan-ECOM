"use client";

import { DataTable } from "@/components/ui/data-table";
import { ownershipColumns } from "./ownership-columns";
import type { OwnershipRecordItem } from "../types";

interface OwnershipTableProps {
  items: OwnershipRecordItem[];
  isLoading?: boolean;
}

export default function OwnershipTable({
  items,
  isLoading = false,
}: OwnershipTableProps) {
  return (
    <div className="space-y-4">
      <DataTable
        data={items}
        columns={ownershipColumns}
        keyExtractor={(row) => row.id}
        hoverable
        isLoading={isLoading}
        showRowNumbers
      >
        <DataTable.Container>
          <DataTable.Table>
            <DataTable.Header />
            <DataTable.Body
              emptyTitle="No ownership records found"
              emptyMessage="No pieces or owners match the selected filters or search query."
            />
          </DataTable.Table>
        </DataTable.Container>
      </DataTable>
    </div>
  );
}
