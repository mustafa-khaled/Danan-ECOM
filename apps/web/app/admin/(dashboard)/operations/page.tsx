"use client";

import { useMemo, useState } from "react";
import {
  OperationsTable,
  OperationsTableFilter,
  type OperationItem,
} from "@/features/admin";

const stats = [
  {
    id: 1,
    title: "Pending Requests",
    count: 12,
  },
  {
    id: 2,
    title: "Transfer Requests",
    count: 6,
  },
  {
    id: 3,
    title: "Access Requests",
    count: 5,
  },
  {
    id: 4,
    title: "Completed Requests",
    count: 24,
  },
] as const;

const initialOperations: OperationItem[] = [
  {
    id: "op-1",
    requestNumber: "REQ-2025-081",
    title: "Heritage Pendant Transfer",
    type: "PIECE_TRANSFER",
    transferType: "INCOMING",
    memberName: "Sultan Al-Otaibi",
    memberEmail: "sultan.otaibi@dadan.sa",
    date: "12 Jan 2025",
    status: "PENDING",
    pieceName: "Heritage Pendant #004",
  },
  {
    id: "op-2",
    requestNumber: "REQ-2025-080",
    title: "House Key Access Request",
    type: "ACCESS_REQUEST",
    transferType: "INTERNAL",
    memberName: "Noura Al-Saud",
    memberEmail: "noura.saud@royalhouse.sa",
    date: "11 Jan 2025",
    status: "COMPLETED",
    pieceName: "Royal Signet Ring #012",
  },
  {
    id: "op-3",
    requestNumber: "REQ-2025-079",
    title: "Outgoing Transfer of Mawaddah",
    type: "PIECE_TRANSFER",
    transferType: "OUTGOING",
    memberName: "Tariq Mansour",
    memberEmail: "tariq.mansour@gmail.com",
    date: "10 Jan 2025",
    status: "UNDER_REVIEW",
    pieceName: "Mawaddah Ring #008",
  },
  {
    id: "op-4",
    requestNumber: "REQ-2025-078",
    title: "Class A Membership Upgrade",
    type: "MEMBERSHIP_UPGRADE",
    transferType: "INTERNAL",
    memberName: "Reem Al-Ghamdi",
    memberEmail: "reem.ghamdi@dadan.sa",
    date: "09 Jan 2025",
    status: "PENDING",
    pieceName: "House Key Access",
  },
  {
    id: "op-5",
    requestNumber: "REQ-2025-077",
    title: "Ownership Certificate Transfer",
    type: "PIECE_TRANSFER",
    transferType: "INCOMING",
    memberName: "Fahad Al-Husseini",
    memberEmail: "fahad.h@atelier.com",
    date: "08 Jan 2025",
    status: "COMPLETED",
    pieceName: "AlUla Cuff Bracelet #002",
  },
  {
    id: "op-6",
    requestNumber: "REQ-2025-076",
    title: "Private Key Issuance",
    type: "KEY_ISSUANCE",
    transferType: "INTERNAL",
    memberName: "Lina Al-Khatib",
    memberEmail: "lina.khatib@luxury.sa",
    date: "06 Jan 2025",
    status: "REJECTED",
    pieceName: "Security Key Protocol",
  },
  {
    id: "op-7",
    requestNumber: "REQ-2025-075",
    title: "Desert Rose Choker Transfer",
    type: "PIECE_TRANSFER",
    transferType: "OUTGOING",
    memberName: "Khalid Bin Rashid",
    memberEmail: "khalid.rashid@house.sa",
    date: "05 Jan 2025",
    status: "COMPLETED",
    pieceName: "Desert Rose Choker #001",
  },
  {
    id: "op-8",
    requestNumber: "REQ-2025-074",
    title: "Heritage Brooch Transfer",
    type: "PIECE_TRANSFER",
    transferType: "INCOMING",
    memberName: "Maha Al-Dossary",
    memberEmail: "maha.dossary@invest.sa",
    date: "03 Jan 2025",
    status: "PENDING",
    pieceName: "Heritage Brooch #009",
  },
];

export default function OperationsPage() {
  const [operations] = useState<OperationItem[]>(initialOperations);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [transferFilter, setTransferFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredOperations = useMemo(() => {
    return operations.filter((op) => {
      // Search filter
      if (searchValue.trim()) {
        const q = searchValue.toLowerCase();
        const matchesSearch =
          op.title.toLowerCase().includes(q) ||
          op.requestNumber.toLowerCase().includes(q) ||
          op.memberName.toLowerCase().includes(q) ||
          op.memberEmail.toLowerCase().includes(q) ||
          (op.pieceName && op.pieceName.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== "all" && op.status !== statusFilter) {
        return false;
      }

      // Transfer type filter
      if (transferFilter !== "all" && op.transferType !== transferFilter) {
        return false;
      }

      // Request type filter
      if (typeFilter !== "all" && op.type !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [operations, searchValue, statusFilter, transferFilter, typeFilter]);

  return (
    <>
      <div className="bg-white h-15 px-7.5 flex items-center font-bold text-h5 text-neutral-800">
        Manage pending requests and operational activities across the DADAN House.
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

            <OperationsTable items={filteredOperations} />
          </div>
        </div>
      </div>
    </>
  );
}

