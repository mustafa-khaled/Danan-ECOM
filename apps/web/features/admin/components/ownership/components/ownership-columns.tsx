"use client";

import Link from "next/link";
import Image from "next/image";
import { type ColumnDef } from "@/components/ui/data-table";
import { Gem } from "lucide-react";
import { OwnershipRowActions } from "./ownership-row-actions";
import type { OwnershipRecordItem, OwnershipRecordStatus } from "../types";
import { pickLocalized } from "@/shared/lib/pick-localized";
import type { Locale } from "@/i18n/routing";

type TranslateFn = (key: string) => string;

const statusBadgeStyles: Record<
  OwnershipRecordStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  OWNED: {
    bg: "bg-[#ECFDF5]",
    text: "text-[#065F46]",
    border: "border-[#A7F3D0]",
    dot: "bg-[#059669]",
  },
  IN_TRANSFER: {
    bg: "bg-[#EFF6FF]",
    text: "text-[#1D4ED8]",
    border: "border-[#BFDBFE]",
    dot: "bg-[#2563EB]",
  },
  PENDING: {
    bg: "bg-[#FEF3C7]",
    text: "text-[#B45309]",
    border: "border-[#FDE68A]",
    dot: "bg-[#D97706]",
  },
  AVAILABLE: {
    bg: "bg-[#F3F4F6]",
    text: "text-[#4B5563]",
    border: "border-[#E5E7EB]",
    dot: "bg-[#9CA3AF]",
  },
};

export function getOwnershipColumns(
  t: TranslateFn,
  locale: Locale,
): ColumnDef<OwnershipRecordItem>[] {
  const statusLabels: Record<OwnershipRecordStatus, string> = {
    OWNED: t("status.owned"),
    IN_TRANSFER: t("status.inTransfer"),
    PENDING: t("status.pending"),
    AVAILABLE: t("status.available"),
  };

  return [
    {
      key: "piece",
      label: t("ownership.pieces"),
      accessor: "pieceName",
      width: "220px",
      render: (_, row) => {
        const name = pickLocalized(locale, row.pieceName, row.pieceNameAr);
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center shrink-0 relative">
              {row.pieceImageUrl ? (
                <Image
                  src={row.pieceImageUrl}
                  alt={row.pieceName}
                  fill
                  className="object-cover"
                />
              ) : (
                <Gem className="size-5 text-neutral-400" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <Link
                href={`/admin/pieces/${row.pieceId}`}
                className="font-medium text-sm text-neutral-900 hover:text-warm-600 transition-colors truncate"
              >
                {name}
              </Link>
              <span className="text-xs font-mono text-neutral-400 truncate">
                {row.pieceSerial}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "owner",
      label: t("common.owner"),
      accessor: "ownerName",
      width: "200px",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xs font-semibold text-neutral-700 shrink-0">
            {row.ownerName
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-sm text-neutral-900 truncate">
              {row.ownerName}
            </span>
            <span className="text-xs text-neutral-400 truncate">{row.ownerEmail}</span>
          </div>
        </div>
      ),
    },
    {
      key: "collection",
      label: t("common.collection"),
      accessor: "collectionName",
      width: "160px",
      render: (_, row) => {
        const name = pickLocalized(locale, row.collectionName, row.collectionNameAr);
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-neutral-200 text-xs font-medium text-neutral-700 truncate">
            {name}
          </span>
        );
      },
    },
    {
      key: "status",
      label: t("common.status"),
      accessor: "status",
      width: "130px",
      align: "center",
      render: (value) => {
        const statusKey = (value as OwnershipRecordStatus) || "OWNED";
        const style = statusBadgeStyles[statusKey] || statusBadgeStyles.OWNED;

        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {statusLabels[statusKey]}
          </span>
        );
      },
    },
    {
      key: "since",
      label: t("common.since"),
      accessor: "since",
      width: "130px",
      render: (value) => (
        <span className="text-xs text-neutral-600">{String(value)}</span>
      ),
    },
    {
      key: "actions",
      label: t("common.actions"),
      width: "80px",
      align: "right",
      hideable: false,
      render: (_, row) => <OwnershipRowActions record={row} />,
    },
  ];
}
