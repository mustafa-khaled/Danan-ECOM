"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  OperationsTable,
  OperationsTableFilter,
  type OperationItem,
} from "@/features/admin";
import {
  fetchAdminOperations,
  fetchAdminOperationsStats,
} from "@/features/admin/api/fetch-admin-operations";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { pickLocalized } from "@/shared/lib/pick-localized";
import { formatAdminDate } from "@/shared/utils/format";

export default function OperationsPage() {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [transferFilter, setTransferFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const statsQuery = useQuery({
    queryKey: ["admin-operations-stats"],
    queryFn: () => fetchAdminOperationsStats(),
  });
  const operationsQuery = useQuery({
    queryKey: ["admin-operations", searchValue, statusFilter, typeFilter],
    queryFn: () =>
      fetchAdminOperations(1, 20, undefined, {
        q: searchValue || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        type: typeFilter === "all" ? undefined : typeFilter,
      }),
  });

  const operations: OperationItem[] = useMemo(() => {
    return (operationsQuery.data?.items ?? [])
      .filter((item) => transferFilter === "all" || item.transferType === transferFilter)
      .map((item) => {
        const pieceName = pickLocalized(locale, item.pieceName ?? "", item.pieceNameAr);
        return {
          id: item.id,
          kind: item.kind,
          requestNumber: item.requestNumber,
          title: item.kind === "transfer" && pieceName
            ? `${pieceName} ${t("operations.transferSuffix")}`
            : item.title,
          type: item.type as OperationItem["type"],
          transferType: item.transferType as OperationItem["transferType"],
          memberName: item.memberName,
          memberEmail: item.memberEmail,
          date: formatAdminDate(item.date, locale),
          status: item.status as OperationItem["status"],
          pieceName,
        };
      });
  }, [operationsQuery.data, transferFilter, locale, t]);

  const stats = [
    { id: 1, title: t("operations.pendingRequests"), count: statsQuery.data?.pending ?? 0 },
    { id: 2, title: t("operations.transferRequests"), count: statsQuery.data?.transfers ?? 0 },
    { id: 3, title: t("operations.accessRequests"), count: statsQuery.data?.access ?? 0 },
    { id: 4, title: t("operations.completedRequests"), count: statsQuery.data?.completed ?? 0 },
  ];

  return (
    <>
      <div className="bg-white h-15 px-7.5 flex items-center font-bold text-h5 text-neutral-800">
        {t("operations.banner")}
      </div>

      <div className="px-7.5 py-6.75">
        <div className="bg-white rounded-3xl p-6 space-y-6">
          <div className="grid grid-cols-4 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.id}
                className="flex flex-col font-medium items-start justify-center rounded-2xl border border-[#F3F3F3] p-6 h-30"
              >
                <h4 className="font-heading text-[40px]">{stat.count}</h4>
                <p className="text-[#5D697A] text-[12px]">{stat.title}</p>
              </div>
            ))}
          </div>

          <div className="mt-[32px]">
            <h4 className="font-heading text-h4 font-bold uppercase text-[#272D35] mb-6">
              Operations
            </h4>
            <OperationsTableFilter
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              transferFilter={transferFilter}
              onTransferFilterChange={setTransferFilter}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
            />

            <OperationsTable items={operations} />
          </div>
        </div>
      </div>
    </>
  );
}
