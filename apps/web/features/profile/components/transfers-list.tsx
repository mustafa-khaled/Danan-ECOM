"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TransferSummary } from "@/features/transfers";
import { formatTransferStatus } from "@/shared/utils/format";

interface TransfersListProps {
  transfers: TransferSummary[];
  emptyTitle: string;
  emptyDescription: string;
}

export function TransfersList({
  transfers,
  emptyTitle,
  emptyDescription,
}: TransfersListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredTransfers = useMemo(() => {
    if (statusFilter === "all") return transfers;
    return transfers.filter((t) =>
      t.status.toLowerCase().includes(statusFilter.toLowerCase())
    );
  }, [transfers, statusFilter]);

  const formatStartedDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "STARTED YESTERDAY";
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return "STARTED TODAY";
      if (diffDays === 1) return "STARTED YESTERDAY";
      return `STARTED ${date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }).toUpperCase()}`;
    } catch {
      return "STARTED YESTERDAY";
    }
  };

  const getStatusBadgeStyles = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes("PENDING") || s.includes("WAITING") || s.includes("INITIATED")) {
      return "bg-[#FFF9E6] text-[#D97706]";
    }
    if (s.includes("CONFIRMED") || s.includes("COMPLETED") || s.includes("SUCCESS")) {
      return "bg-[#E6F4EA] text-[#137333]";
    }
    if (s.includes("CANCEL") || s.includes("REJECT") || s.includes("EXPIRED")) {
      return "bg-[#FCE8E6] text-[#C5221F]";
    }
    return "bg-[#FFF9E6] text-[#D97706]";
  };

  return (
    <div className="space-y-6">
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger
          className="flex w-full items-center justify-between sm:max-w-[50%] rounded-xl bg-[#F1F3F5] px-4 py-3.5 sm:px-5 font-bold text-base sm:text-lg text-[#1E293B] shadow-none outline-none transition-colors hover:bg-[#E5E8EB] cursor-pointer [&_svg]:size-5 [&_svg]:text-[#1E293B] [&_svg]:opacity-100"
          aria-label="Filter transfers"
        >
          <SelectValue placeholder="All Transfers" />
        </SelectTrigger>

        <SelectContent className="z-50 w-(--radix-select-trigger-width) min-w-(--radix-select-trigger-width) overflow-hidden rounded-xl border border-gray-100 bg-white p-1.5 shadow-lg">
          <SelectItem
            value="all"
            className="cursor-pointer font-medium text-[#1E293B]"
          >
            All Transfers
          </SelectItem>
          <SelectItem
            value="pending"
            className="cursor-pointer font-medium text-[#1E293B]"
          >
            Pending
          </SelectItem>
          <SelectItem
            value="completed"
            className="cursor-pointer font-medium text-[#1E293B]"
          >
            Completed
          </SelectItem>
          <SelectItem
            value="cancelled"
            className="cursor-pointer font-medium text-[#1E293B]"
          >
            Cancelled
          </SelectItem>
        </SelectContent>
      </Select>

      {filteredTransfers.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={{ href: "/beta/profile/wardrobe", label: "View Wardrobe" }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredTransfers.map((transfer) => {
            const formattedStatus = formatTransferStatus(transfer.status);
            const badgeClass = getStatusBadgeStyles(transfer.status);

            return (
              <Link
                key={transfer.id}
                href={`/beta/transfers/${transfer.id}`}
                className="group block rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-shadow hover:shadow-sm"
                style={{ backgroundColor: "var(--Contessa-50, #FBF7F7)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-base sm:text-lg text-[#1E293B] tracking-tight uppercase">
                    {transfer.piece.name}
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold ${badgeClass}`}
                  >
                    {formattedStatus}
                  </span>
                </div>

                <p className="mt-2 text-xs sm:text-sm font-medium uppercase text-[#525866]">
                  {transfer.transferType}
                </p>

                <p className="mt-2 text-[11px] sm:text-xs uppercase text-[#667085]">
                  {formatStartedDate(transfer.initiatedAt)}
                </p>

                <div className="mt-4 sm:mt-5 flex items-center justify-between">
                  <span className="text-sm sm:text-base font-medium text-[#BC776E]">
                    View Details
                  </span>
                  <ArrowRight
                    className="w-4 h-4 sm:w-5 sm:h-5 text-[#BC776E] transition-transform group-hover:translate-x-1"
                    strokeWidth={1.5}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
