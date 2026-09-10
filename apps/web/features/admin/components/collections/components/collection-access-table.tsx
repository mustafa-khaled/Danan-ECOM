"use client";

import { DataTable } from "@/components/ui/data-table";
import { Pagination, PaginationSuspenseBoundary } from "@/components/ui/pagination";
import type { AdminClientListItem } from "@/features/admin/types";
import { ADMIN_PAGE_SIZE } from "@/shared/lib/parse-admin-page";
import { collectionAccessColumns } from "./collection-access-columns";

interface CollectionAccessTableProps {
  items: AdminClientListItem[];
  total: number;
}

export default function CollectionAccessTable({
  items,
  total,
}: CollectionAccessTableProps) {
  return (
    <div className="space-y-4">
      <DataTable
        data={items}
        columns={collectionAccessColumns}
        keyExtractor={(row) => row.id}
        showRowNumbers
        hoverable
      >
        <DataTable.Container>
          <DataTable.Table>
            <DataTable.Header />
            <DataTable.Body
              emptyTitle="No members found"
              emptyMessage="There are no members assigned to this collection access list yet."
            />
          </DataTable.Table>
        </DataTable.Container>

        <DataTable.BulkBar>
          {(selected: Set<string>) => (
            <span className="text-xs font-body text-ds-text-secondary">
              {selected.size} member{selected.size !== 1 ? "s" : ""} selected
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
