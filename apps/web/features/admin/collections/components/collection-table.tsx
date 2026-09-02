"use client";

import { DataTable } from "@/components/ui/data-table";
import { Pagination, PaginationSuspenseBoundary } from "@/components/ui/pagination";
import type { AdminCollectionListItem } from "@/features/admin/types";
import { ADMIN_PAGE_SIZE } from "@/shared/lib/parse-admin-page";
import { collectionColumns } from "./collection-columns";

interface CollectionTableProps {
  items: AdminCollectionListItem[];
  total: number;
}

export default function CollectionTable({ items, total }: CollectionTableProps) {
  return (
    <div className="space-y-4">
      <DataTable
        data={items}
        columns={collectionColumns}
        keyExtractor={(row) => row.id}
        selectable
        showRowNumbers
        hoverable
      >
        <DataTable.Container>
          <DataTable.Table>
            <DataTable.Header />
            <DataTable.Body
              emptyTitle="No collections yet"
              emptyMessage="Create your first collection to get started."
            />
          </DataTable.Table>
        </DataTable.Container>

        <DataTable.BulkBar>
          {(selected: Set<string>) => (
            <span className="text-xs font-body text-ds-text-secondary">
              {selected.size} collection{selected.size !== 1 ? "s" : ""} selected
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
