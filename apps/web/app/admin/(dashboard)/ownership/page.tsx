"use client";

import { useMemo, useState } from "react";
import {
  OwnershipTable,
  OwnershipTableFilter,
  type OwnershipRecordItem,
} from "@/features/admin";

const stats = [
  {
    id: 1,
    title: "Total Owned",
    count: 324,
  },
  {
    id: 2,
    title: "Transfers",
    count: 48,
  },
  {
    id: 3,
    title: "Pending Transfers",
    count: 6,
  },
  {
    id: 4,
    title: "Available",
    count: 22,
  },
] as const;

const initialRecords: OwnershipRecordItem[] = [
  {
    id: "own-1",
    pieceId: "p-1",
    pieceName: "Heritage Pendant",
    pieceSerial: "DDN-HP-004",
    pieceImageUrl: "/assets/wardrobe.avif",
    ownerName: "Sultan Al-Otaibi",
    ownerEmail: "sultan.otaibi@dadan.sa",
    collectionName: "Royal Desert",
    status: "OWNED",
    transferType: "DIRECT",
    since: "12 Jan 2024",
  },
  {
    id: "own-2",
    pieceId: "p-2",
    pieceName: "Mawaddah Ring",
    pieceSerial: "DDN-MR-018",
    pieceImageUrl: "/assets/mawaddah.avif",
    ownerName: "Noura Al-Saud",
    ownerEmail: "noura.saud@royalhouse.sa",
    collectionName: "Eternal Sands",
    status: "IN_TRANSFER",
    transferType: "SECONDARY",
    since: "04 Feb 2024",
  },
  {
    id: "own-3",
    pieceId: "p-3",
    pieceName: "AlUla Cuff Bracelet",
    pieceSerial: "DDN-AC-002",
    pieceImageUrl: "/assets/wardrobe.avif",
    ownerName: "Tariq Mansour",
    ownerEmail: "tariq.mansour@gmail.com",
    collectionName: "AlUla Heritage",
    status: "OWNED",
    transferType: "DIRECT",
    since: "20 Mar 2024",
  },
  {
    id: "own-4",
    pieceId: "p-4",
    pieceName: "Royal Signet Ring",
    pieceSerial: "DDN-RS-012",
    pieceImageUrl: "/assets/mawaddah.avif",
    ownerName: "Reem Al-Ghamdi",
    ownerEmail: "reem.ghamdi@dadan.sa",
    collectionName: "Royal Desert",
    status: "PENDING",
    transferType: "GIFT",
    since: "15 Apr 2024",
  },
  {
    id: "own-5",
    pieceId: "p-5",
    pieceName: "Desert Rose Choker",
    pieceSerial: "DDN-DR-001",
    pieceImageUrl: "/assets/wardrobe.avif",
    ownerName: "Fahad Al-Husseini",
    ownerEmail: "fahad.h@atelier.com",
    collectionName: "Celestial Oasis",
    status: "OWNED",
    transferType: "INHERITED",
    since: "02 May 2024",
  },
  {
    id: "own-6",
    pieceId: "p-6",
    pieceName: "Oasis Tiara",
    pieceSerial: "DDN-OT-007",
    pieceImageUrl: "/assets/wardrobe.avif",
    ownerName: "Lina Al-Khatib",
    ownerEmail: "lina.khatib@luxury.sa",
    collectionName: "Celestial Oasis",
    status: "AVAILABLE",
    transferType: "NONE",
    since: "18 Jun 2024",
  },
  {
    id: "own-7",
    pieceId: "p-7",
    pieceName: "Heritage Brooch",
    pieceSerial: "DDN-HB-009",
    pieceImageUrl: "/assets/mawaddah.avif",
    ownerName: "Khalid Bin Rashid",
    ownerEmail: "khalid.rashid@house.sa",
    collectionName: "Royal Desert",
    status: "OWNED",
    transferType: "DIRECT",
    since: "01 Jul 2024",
  },
  {
    id: "own-8",
    pieceId: "p-8",
    pieceName: "Lapis Lazuli Seal",
    pieceSerial: "DDN-LS-003",
    pieceImageUrl: "/assets/wardrobe.avif",
    ownerName: "Maha Al-Dossary",
    ownerEmail: "maha.dossary@invest.sa",
    collectionName: "AlUla Heritage",
    status: "OWNED",
    transferType: "SECONDARY",
    since: "14 Aug 2024",
  },
];

const availableCollections = [
  "Royal Desert",
  "Eternal Sands",
  "AlUla Heritage",
  "Celestial Oasis",
];

export default function OwnershipPage() {
  const [records] = useState<OwnershipRecordItem[]>(initialRecords);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [collectionFilter, setCollectionFilter] = useState("all");
  const [transferTypeFilter, setTransferTypeFilter] = useState("all");

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Search filter
      if (searchValue.trim()) {
        const q = searchValue.toLowerCase();
        const matchesSearch =
          rec.pieceName.toLowerCase().includes(q) ||
          rec.pieceSerial.toLowerCase().includes(q) ||
          rec.ownerName.toLowerCase().includes(q) ||
          rec.ownerEmail.toLowerCase().includes(q) ||
          rec.collectionName.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== "all" && rec.status !== statusFilter) {
        return false;
      }

      // Collection filter
      if (collectionFilter !== "all" && rec.collectionName !== collectionFilter) {
        return false;
      }

      // Transfer Type filter
      if (
        transferTypeFilter !== "all" &&
        rec.transferType !== transferTypeFilter
      ) {
        return false;
      }

      return true;
    });
  }, [records, searchValue, statusFilter, collectionFilter, transferTypeFilter]);

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
              collections={availableCollections}
            />

            <OwnershipTable items={filteredRecords} />
          </div>
        </div>
      </div>
    </>
  );
}
