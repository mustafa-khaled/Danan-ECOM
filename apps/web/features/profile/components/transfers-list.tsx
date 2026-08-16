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
import { Badge } from "@/components/ui";
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
      if (isNaN(date.getTime())) return "STARTED --";
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return "STARTED TODAY";
      if (diffDays === 1) return "STARTED YESTERDAY";
      return `STARTED ${date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }).toUpperCase()}`;
    } catch {
      return "STARTED --";
    }
  };

  const getStatusBadgeVariant = (status: string): "warning" | "success" | "error" | "default" => {
    const s = status.toUpperCase();
    if (s.includes("PENDING") || s.includes("WAITING") || s.includes("INITIATED")) {
      return "warning";
    }
    if (s.includes("CONFIRMED") || s.includes("COMPLETED") || s.includes("SUCCESS")) {
      return "success";
    }
    if (s.includes("CANCEL") || s.includes("REJECT") || s.includes("EXPIRED")) {
      return "error";
    }
    return "warning";
  };

  return (
    <div className="space-y-6">
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger
          className="flex w-full items-center justify-between sm:max-w-[50%] rounded-(--radius-md) bg-ds-surface px-4 py-3 sm:px-5 font-bold text-base text-ds-text shadow-none outline-none transition-colors hover:bg-ds-surface-warm cursor-pointer [&_svg]:size-5 [&_svg]:text-ds-text [&_svg]:opacity-100"
          aria-label="Filter transfers"
        >
          <SelectValue placeholder="All Transfers" />
        </SelectTrigger>

        <SelectContent className="z-(--z-popover) w-(--radix-select-trigger-width) min-w-(--radix-select-trigger-width) overflow-hidden rounded-(--radius-md) border border-ds-border bg-ds-background p-1.5 shadow-lg">
          <SelectItem
            value="all"
            className="cursor-pointer font-medium text-ds-text"
          >
            All Transfers
          </SelectItem>
          <SelectItem
            value="pending"
            className="cursor-pointer font-medium text-ds-text"
          >
            Pending
          </SelectItem>
          <SelectItem
            value="completed"
            className="cursor-pointer font-medium text-ds-text"
          >
            Completed
          </SelectItem>
          <SelectItem
            value="cancelled"
            className="cursor-pointer font-medium text-ds-text"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          {filteredTransfers.map((transfer) => {
            const formattedStatus = formatTransferStatus(transfer.status);
            const badgeVariant = getStatusBadgeVariant(transfer.status);

            return (
              <Link
                key={transfer.id}
                href={`/beta/profile/transfers/${transfer.id}`}
                className="group block rounded-lg p-4 sm:p-5 bg-ds-surface-warm border border-ds-border-light transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-base text-ds-text tracking-tight uppercase font-body">
                    {transfer.piece.name}
                  </h3>
                  <Badge variant={badgeVariant} size="sm">
                    {formattedStatus}
                  </Badge>
                </div>

                <p className="mt-2 text-xs sm:text-sm font-medium uppercase text-ds-text-secondary font-body">
                  {transfer.transferType}
                </p>

                <p className="mt-2 text-caption sm:text-xs uppercase text-ds-text-muted font-body">
                  {formatStartedDate(transfer.initiatedAt)}
                </p>

                <div className="mt-4 sm:mt-5 flex items-center justify-between">
                  <span className="text-sm sm:text-base font-medium text-ds-primary">
                    View Details
                  </span>
                  <ArrowRight
                    className="w-4 h-4 sm:w-5 sm:h-5 text-ds-primary transition-transform group-hover:translate-x-1"
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
