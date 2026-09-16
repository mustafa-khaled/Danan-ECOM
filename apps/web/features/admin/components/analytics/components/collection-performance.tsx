"use client";

import { useState } from "react";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { useTranslations } from "next-intl";

interface CollectionPerformanceItem {
  name: string;
  views: number;
  saves: number;
  acquisitions: number;
}

export default function CollectionPerformance({
  data = [],
}: {
  data?: CollectionPerformanceItem[];
}) {
  const t = useTranslations("admin");
  const collectionPerformanceData = data;

const columns: ColumnDef<CollectionPerformanceItem>[] = [
  {
    key: "name",
    label: t("common.collection"),
    accessor: "name",
    sortable: true,
  },
  {
    key: "views",
    label: t("analytics.views"),
    accessor: "views",
    align: "right",
    sortable: true,
    render: (v) => (
      <span className="tabular-nums text-sm">{Number(v).toLocaleString()}</span>
    ),
  },
  {
    key: "saves",
    label: t("analytics.saves"),
    accessor: "saves",
    align: "right",
    sortable: true,
    render: (v) => (
      <span className="tabular-nums text-sm">{Number(v).toLocaleString()}</span>
    ),
  },
  {
    key: "acquisitions",
    label: t("analytics.acquisitions"),
    accessor: "acquisitions",
    align: "right",
    sortable: true,
    render: (v) => (
      <span className="tabular-nums text-sm">{Number(v).toLocaleString()}</span>
    ),
  },
];

  const [sort, setSort] = useState<
    | {
        column: string;
        direction: "asc" | "desc";
      }
    | undefined
  >(undefined);

  const sortedData = [...collectionPerformanceData].sort((a, b) => {
    if (!sort) return 0;
    const val = sort.direction === "asc" ? 1 : -1;
    if (sort.column === "name") return a.name.localeCompare(b.name) * val;
    const aVal = a[sort.column as keyof CollectionPerformanceItem] as number;
    const bVal = b[sort.column as keyof CollectionPerformanceItem] as number;
    return (aVal - bVal) * val;
  });

  return (
    <div>
      <h4 className="uppercase font-heading mb-6 text-h4 font-bold">
        {t("analytics.collectionPerformance")}
      </h4>

      <DataTable
        data={sortedData}
        columns={columns}
        keyExtractor={(row) => row.name}
        hoverable
        compact
      >
        <DataTable.Container className="rounded-none!">
          <DataTable.Table>
            <DataTable.Header
              onSort={(column, direction) => setSort({ column, direction })}
              currentSort={sort}
            />
            <DataTable.Body
              emptyTitle={t("analytics.noData")}
              emptyMessage={t("analytics.noDataMessage")}
            />
          </DataTable.Table>
        </DataTable.Container>
      </DataTable>
    </div>
  );
}
