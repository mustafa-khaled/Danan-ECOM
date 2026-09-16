"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  OwnershipTable,
  OwnershipTableFilter,
  type OwnershipRecordItem,
} from "@/features/admin";
import {
  fetchAdminOwnership,
  fetchAdminOwnershipStats,
} from "@/features/admin/api/fetch-admin-ownership";
import { fetchAdminCollections } from "@/features/admin/api/fetch-admin-collections";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { pickLocalized } from "@/shared/lib/pick-localized";
import { formatAdminDate } from "@/shared/utils/format";

export default function OwnershipPage() {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [collectionFilter, setCollectionFilter] = useState("all");
  const [transferTypeFilter, setTransferTypeFilter] = useState("all");

  const collectionsQuery = useQuery({
    queryKey: ["admin-collections"],
    queryFn: () => fetchAdminCollections(1, 100),
  });
  const selectedCollection = collectionsQuery.data?.items.find(
    (collection) => collection.name === collectionFilter,
  );

  const statsQuery = useQuery({
    queryKey: ["admin-ownership-stats"],
    queryFn: () => fetchAdminOwnershipStats(),
  });
  const recordsQuery = useQuery({
    queryKey: ["admin-ownership", searchValue, statusFilter, selectedCollection?.id],
    queryFn: () =>
      fetchAdminOwnership(1, 20, undefined, {
        q: searchValue || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        collectionId: selectedCollection?.id,
      }),
  });

  const records: OwnershipRecordItem[] = (recordsQuery.data?.items ?? [])
    .filter((item) =>
      transferTypeFilter === "all" || item.transferType === transferTypeFilter,
    )
    .map((item) => ({
      id: item.id,
      pieceId: item.pieceId,
      pieceName: pickLocalized(locale, item.pieceName, item.pieceNameAr),
      pieceSerial: item.pieceSerial,
      pieceImageUrl: item.pieceImageUrl ?? undefined,
      ownerName: item.ownerName ?? "",
      ownerEmail: item.ownerEmail ?? "",
      collectionName: pickLocalized(locale, item.collectionName, item.collectionNameAr),
      status: item.status,
      transferType: (item.transferType as OwnershipRecordItem["transferType"]) ?? "NONE",
      since: formatAdminDate(item.since, locale),
    }));

  const stats = [
    { id: 1, title: t("ownership.totalOwned"), count: statsQuery.data?.owned ?? 0 },
    { id: 2, title: t("ownership.transfers"), count: statsQuery.data?.transfers ?? 0 },
    { id: 3, title: t("ownership.pendingTransfers"), count: statsQuery.data?.pendingTransfers ?? 0 },
    { id: 4, title: t("ownership.available"), count: statsQuery.data?.available ?? 0 },
  ];

  return (
    <>
      <div className="bg-white h-15 px-7.5 flex items-center font-bold text-h5 text-neutral-800">
        {t("ownership.banner")}
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
              OWNERSHIP RECORDS
            </h4>

            <OwnershipTableFilter
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              collectionFilter={collectionFilter}
              onCollectionFilterChange={setCollectionFilter}
              transferTypeFilter={transferTypeFilter}
              onTransferTypeFilterChange={setTransferTypeFilter}
              collections={collectionsQuery.data?.items.map((c) => c.name) ?? []}
            />

            <OwnershipTable items={records} />
          </div>
        </div>
      </div>
    </>
  );
}
