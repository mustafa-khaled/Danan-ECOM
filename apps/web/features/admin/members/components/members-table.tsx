"use client";

import { DataTable } from "@/components/ui/data-table";
import { membersColumns } from "./members-columns";
import type { MemberListItem } from "../types";

interface MembersTableProps {
  items: MemberListItem[];
  isLoading?: boolean;
}

export default function MembersTable({
  items,
  isLoading = false,
}: MembersTableProps) {
  return (
    <div className="space-y-4">
      <DataTable
        data={items}
        columns={membersColumns}
        keyExtractor={(row) => row.id}
        hoverable
        isLoading={isLoading}
        showRowNumbers
      >
        <DataTable.Container>
          <DataTable.Table>
            <DataTable.Header />
            <DataTable.Body
              emptyTitle="No members found"
              emptyMessage="No members match the selected filters or search query."
            />
          </DataTable.Table>
        </DataTable.Container>
      </DataTable>
    </div>
  );
}
