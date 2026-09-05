"use client";

import { DataTable } from "@/components/ui/data-table";
import { Pagination, PaginationSuspenseBoundary } from "@/components/ui/pagination";
import type { AdminPieceListItem } from "@/features/admin/types";
import { ADMIN_PAGE_SIZE } from "@/shared/lib/parse-admin-page";
import { collectionPiecesColumns } from "./collection-pieces-columns";

interface CollectionPiecesTableProps {
  items: AdminPieceListItem[];
  total: number;
}

export default function CollectionPiecesTable({
  items,
  total,
}: CollectionPiecesTableProps) {
  return (
    <div className="space-y-4">
      <DataTable
        data={items}
        columns={collectionPiecesColumns}
        keyExtractor={(row) => row.id}
        showRowNumbers
        hoverable
      >
        <DataTable.Container>
          <DataTable.Table>
            <DataTable.Header />
            <DataTable.Body
              emptyTitle="No pieces found"
              emptyMessage="There are no registered pieces in this collection yet."
            />
          </DataTable.Table>
        </DataTable.Container>

        <DataTable.BulkBar>
          {(selected: Set<string>) => (
            <span className="text-xs font-body text-ds-text-secondary">
              {selected.size} piece{selected.size !== 1 ? "s" : ""} selected
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
