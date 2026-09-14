"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MembersTable,
  MembersTableFilter,
  type MemberListItem,
} from "@/features/admin";
import { fetchAdminClients } from "@/features/admin/api/fetch-admin-clients";
import { fetchAdminClasses } from "@/features/admin/api/fetch-admin-classes";
import { fetchAdminClientStats } from "@/features/admin/api/fetch-admin-stats";
import type { AdminClientListItem } from "@/features/admin/types";

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function mapClient(client: AdminClientListItem): MemberListItem {
  return {
    id: client.id,
    cellNumber: client.phone ?? "",
    name: client.displayName,
    email: client.email,
    membershipClass: client.class?.name ?? "Class C",
    status: client.isActive ? "ACTIVE" : "INACTIVE",
    ownedPiecesCount: client.pieceCount,
    houseKeyActive: client.isActive,
    joinedDate: formatDate(client.createdAt),
    lastActive: formatDate(client.lastSeenAt),
  };
}

export default function MembersPage() {
  const [searchValue, setSearchValue] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [houseKeyFilter, setHouseKeyFilter] = useState("all");

  const classesQuery = useQuery({
    queryKey: ["admin-classes"],
    queryFn: () => fetchAdminClasses(),
  });
  const statsQuery = useQuery({
    queryKey: ["admin-client-stats"],
    queryFn: () => fetchAdminClientStats(),
  });
  const selectedClass = classesQuery.data?.find((cls) => cls.name === classFilter);

  const membersQuery = useQuery({
    queryKey: [
      "admin-clients",
      searchValue,
      selectedClass?.id ?? "all",
      statusFilter,
    ],
    queryFn: () =>
      fetchAdminClients(1, 20, undefined, {
        q: searchValue || undefined,
        classId: selectedClass?.id,
        isActive:
          statusFilter === "ACTIVE"
            ? true
            : statusFilter === "INACTIVE"
              ? false
              : undefined,
      }),
  });

  const members = (membersQuery.data?.items ?? []).map(mapClient);
  const filteredMembers = useMemo(() => {
    if (houseKeyFilter === "all") return members;
    return members.filter((member) =>
      houseKeyFilter === "active" ? member.houseKeyActive : !member.houseKeyActive,
    );
  }, [houseKeyFilter, members]);

  const stats = [
    { id: 1, title: "Total Members", count: statsQuery.data?.total ?? members.length },
    ...(statsQuery.data?.byClass ?? []).slice(0, 3).map((cls, index) => ({
      id: index + 2,
      title: cls.name,
      count: cls.count,
    })),
  ];

  return (
    <>
      <div className="bg-white h-15 px-7.5 flex items-center font-bold text-h5 text-neutral-800">
        Manage House members, access, and membership class.
      </div>

      <div className="px-7.5 py-6.75">
        <div className="bg-white rounded-3xl p-6 space-y-6">
          <div className="grid grid-cols-4 gap-5">
            {stats.map((stat) => (
              <div
                key={stat.id}
                className="h-28 flex flex-col items-start justify-center gap-3 bg-[#FBF7F7] p-6 rounded-xl"
              >
                <h6 className="font-heading text-[#353D48] font-bold text-h5 leading-[100%]">
                  {stat.title}
                </h6>
                <p className="font-semibold text-h6">{stat.count}</p>
              </div>
            ))}
          </div>

          <MembersTableFilter
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            classFilter={classFilter}
            onClassFilterChange={setClassFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            houseKeyFilter={houseKeyFilter}
            onHouseKeyFilterChange={setHouseKeyFilter}
          />
          <MembersTable items={filteredMembers} />
        </div>
      </div>
    </>
  );
}
