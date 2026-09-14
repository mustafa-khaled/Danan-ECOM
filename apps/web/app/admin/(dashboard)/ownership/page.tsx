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

export default function OwnershipPage() {
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
      pieceName: item.pieceName,
      pieceSerial: item.pieceSerial,
      pieceImageUrl: item.pieceImageUrl ?? undefined,
      ownerName: item.ownerName ?? "",
      ownerEmail: item.ownerEmail ?? "",
      collectionName: item.collectionName,
      status: item.status,
      transferType: (item.transferType as OwnershipRecordItem["transferType"]) ?? "NONE",
      since: item.since
        ? new Date(item.since).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "",
    }));

  const stats = [
    { id: 1, title: "Total Owned", count: statsQuery.data?.owned ?? 0 },
    { id: 2, title: "Transfers", count: statsQuery.data?.transfers ?? 0 },
    { id: 3, title: "Pending Transfers", count: statsQuery.data?.pendingTransfers ?? 0 },
    { id: 4, title: "Available", count: statsQuery.data?.available ?? 0 },
  ];

  return (
    <>
      <div className="bg-white h-15 px-7.5 flex items-center font-bold text-h5 text-neutral-800">
        Manage ownership records, transfers, and ownership activity.
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
