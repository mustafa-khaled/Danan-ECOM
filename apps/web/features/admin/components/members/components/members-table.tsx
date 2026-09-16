"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { DataTable } from "@/components/ui/data-table";
import { getMembersColumns } from "./members-columns";
import type { MemberListItem } from "../types";

interface MembersTableProps {
  items: MemberListItem[];
  isLoading?: boolean;
}

export default function MembersTable({
  items,
  isLoading = false,
}: MembersTableProps) {
  const t = useTranslations("admin");
  const columns = useMemo(() => getMembersColumns(t), [t]);

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
              emptyTitle={t("members.emptyFound")}
              emptyMessage={t("members.emptyFoundMessage")}
            />
          </DataTable.Table>
        </DataTable.Container>
      </DataTable>
    </div>
  );
}
