"use client";

import { useMemo, useState } from "react";
import {
  MembersTable,
  MembersTableFilter,
  type MemberListItem,
} from "@/features/admin";

const stats = [
  {
    id: 1,
    title: "Total Members",
    count: 1248,
  },
  {
    id: 2,
    title: "Class A",
    count: 150,
  },
  {
    id: 3,
    title: "Class B",
    count: 542,
  },
  {
    id: 4,
    title: "Class C",
    count: 852,
  },
] as const;

const initialMembers: MemberListItem[] = [
  {
    id: "mem-1",
    cellNumber: "+966 50 123 4567",
    name: "Sultan Al-Otaibi",
    email: "sultan.otaibi@dadan.sa",
    membershipClass: "Class A",
    status: "ACTIVE",
    ownedPiecesCount: 6,
    houseKeyActive: true,
    joinedDate: "12 Jan 2025",
    lastActive: "10 mins ago",
  },
  {
    id: "mem-2",
    cellNumber: "+966 55 987 6543",
    name: "Noura Al-Saud",
    email: "noura.saud@royalhouse.sa",
    membershipClass: "Class A",
    status: "ACTIVE",
    ownedPiecesCount: 12,
    houseKeyActive: true,
    joinedDate: "04 Feb 2025",
    lastActive: "1 hour ago",
  },
  {
    id: "mem-3",
    cellNumber: "+966 54 332 1199",
    name: "Tariq Mansour",
    email: "tariq.mansour@gmail.com",
    membershipClass: "Class B",
    status: "ACTIVE",
    ownedPiecesCount: 3,
    houseKeyActive: true,
    joinedDate: "20 Mar 2025",
    lastActive: "Yesterday",
  },
  {
    id: "mem-4",
    cellNumber: "+966 56 445 6677",
    name: "Reem Al-Ghamdi",
    email: "reem.ghamdi@dadan.sa",
    membershipClass: "Class B",
    status: "PENDING",
    ownedPiecesCount: 1,
    houseKeyActive: false,
    joinedDate: "15 Apr 2025",
    lastActive: "3 days ago",
  },
  {
    id: "mem-5",
    cellNumber: "+966 50 889 9001",
    name: "Fahad Al-Husseini",
    email: "fahad.h@atelier.com",
    membershipClass: "Class C",
    status: "ACTIVE",
    ownedPiecesCount: 2,
    houseKeyActive: true,
    joinedDate: "02 May 2025",
    lastActive: "5 hours ago",
  },
  {
    id: "mem-6",
    cellNumber: "+966 53 771 2233",
    name: "Lina Al-Khatib",
    email: "lina.khatib@luxury.sa",
    membershipClass: "Class C",
    status: "INACTIVE",
    ownedPiecesCount: 0,
    houseKeyActive: false,
    joinedDate: "18 Jun 2025",
    lastActive: "2 weeks ago",
  },
  {
    id: "mem-7",
    cellNumber: "+966 55 112 3344",
    name: "Khalid Bin Rashid",
    email: "khalid.rashid@house.sa",
    membershipClass: "Class A",
    status: "ACTIVE",
    ownedPiecesCount: 8,
    houseKeyActive: true,
    joinedDate: "01 Jul 2025",
    lastActive: "Just now",
  },
  {
    id: "mem-8",
    cellNumber: "+966 54 998 8776",
    name: "Maha Al-Dossary",
    email: "maha.dossary@invest.sa",
    membershipClass: "Class B",
    status: "ACTIVE",
    ownedPiecesCount: 4,
    houseKeyActive: true,
    joinedDate: "14 Aug 2025",
    lastActive: "4 hours ago",
  },
];

export default function MembersPage() {
  const [members] = useState<MemberListItem[]>(initialMembers);
  const [searchValue, setSearchValue] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [houseKeyFilter, setHouseKeyFilter] = useState("all");

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Search
      if (searchValue.trim()) {
        const q = searchValue.toLowerCase();
        const matchesSearch =
          member.name.toLowerCase().includes(q) ||
          member.email.toLowerCase().includes(q) ||
          member.cellNumber.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Class
      if (classFilter !== "all" && member.membershipClass !== classFilter) {
        return false;
      }

      // Status
      if (statusFilter !== "all" && member.status !== statusFilter) {
        return false;
      }

      // House Key
      if (houseKeyFilter === "active" && !member.houseKeyActive) {
        return false;
      }
      if (houseKeyFilter === "inactive" && member.houseKeyActive) {
        return false;
      }

      return true;
    });
  }, [members, searchValue, classFilter, statusFilter, houseKeyFilter]);

  const handleDownload = () => {
    const headers = [
      "#",
      "Member Name",
      "Email",
      "Class",
      "Status",
      "Owned Pieces",
      "House Key",
      "Joined Date",
      "Last Active",
    ];

    const rows = filteredMembers.map((m, idx) => [
      idx + 1,
      `"${m.name}"`,
      `"${m.email}"`,
      `"${m.membershipClass}"`,
      `"${m.status}"`,
      m.ownedPiecesCount,
      m.houseKeyActive ? "Active" : "Inactive",
      `"${m.joinedDate}"`,
      `"${m.lastActive}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dadan_members_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="bg-white h-15 px-7.5 flex items-center font-bold text-h5 text-neutral-800">
        Manage members, House access, and membership status.
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

          <div className="space-y-4">
            <MembersTableFilter
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              classFilter={classFilter}
              onClassFilterChange={setClassFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              houseKeyFilter={houseKeyFilter}
              onHouseKeyFilterChange={setHouseKeyFilter}
              onDownload={handleDownload}
            />

            <MembersTable items={filteredMembers} />
          </div>
        </div>
      </div>
    </>
  );
}
