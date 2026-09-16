"use client";

import Link from "next/link";
import { type ColumnDef } from "@/components/ui/data-table";
import { OperationsRowActions } from "./operations-row-actions";
import type { OperationItem, OperationStatus } from "../types";
import { pickLocalized } from "@/shared/lib/pick-localized";
import type { Locale } from "@/i18n/routing";

type TranslateFn = (key: string) => string;

const statusBadgeStyles: Record<
  OperationStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  PENDING: {
    bg: "bg-[#FEF3C7]",
    text: "text-[#B45309]",
    border: "border-[#FDE68A]",
    dot: "bg-[#D97706]",
  },
  COMPLETED: {
    bg: "bg-[#ECFDF5]",
    text: "text-[#065F46]",
    border: "border-[#A7F3D0]",
    dot: "bg-[#059669]",
  },
  UNDER_REVIEW: {
    bg: "bg-[#EFF6FF]",
    text: "text-[#1D4ED8]",
    border: "border-[#BFDBFE]",
    dot: "bg-[#2563EB]",
  },
  REJECTED: {
    bg: "bg-[#FFF1F2]",
    text: "text-[#BE123C]",
    border: "border-[#FECDD3]",
    dot: "bg-[#E11D48]",
  },
};

export function getOperationsColumns(
  t: TranslateFn,
  locale: Locale,
): ColumnDef<OperationItem>[] {
  const statusLabels: Record<OperationStatus, string> = {
    PENDING: t("status.pending"),
    COMPLETED: t("status.completed"),
    UNDER_REVIEW: t("status.underReview"),
    REJECTED: t("status.rejected"),
  };

  return [
    {
      key: "request",
      label: t("operations.request"),
      accessor: "title",
      width: "220px",
      render: (_, row) => {
        const title =
          row.kind === "transfer"
            ? `${pickLocalized(locale, row.pieceName ?? "", row.pieceNameAr ?? "")} ${t("operations.transferSuffix")}`
            : row.title;
        const pieceDisplay =
          row.pieceName != null
            ? pickLocalized(locale, row.pieceName, row.pieceNameAr)
            : null;
        return (
          <div className="flex flex-col min-w-0">
            <Link
              href={`/admin/operations/${row.id}?kind=${row.kind}`}
              className="font-medium text-sm text-neutral-900 hover:text-warm-600 transition-colors truncate"
            >
              {title}
            </Link>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-mono text-neutral-400">{row.requestNumber}</span>
              {pieceDisplay && (
                <>
                  <span className="text-neutral-300">•</span>
                  <span className="text-xs text-neutral-500 truncate">{pieceDisplay}</span>
                </>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "memberName",
      label: t("operations.memberName"),
      accessor: "memberName",
      width: "200px",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xs font-semibold text-neutral-700 shrink-0">
            {row.memberName
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-sm text-neutral-900 truncate">
              {row.memberName}
            </span>
            <span className="text-xs text-neutral-400 truncate">{row.memberEmail}</span>
          </div>
        </div>
      ),
    },
    {
      key: "date",
      label: t("common.date"),
      accessor: "date",
      width: "140px",
      render: (value) => (
        <span className="text-xs text-neutral-600">{String(value)}</span>
      ),
    },
    {
      key: "status",
      label: t("common.status"),
      accessor: "status",
      width: "140px",
      align: "center",
      render: (value) => {
        const statusKey = (value as OperationStatus) || "PENDING";
        const style = statusBadgeStyles[statusKey] || statusBadgeStyles.PENDING;

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
      key: "actions",
      label: t("common.actions"),
      width: "90px",
      align: "right",
      hideable: false,
      render: (_, row) => <OperationsRowActions operation={row} />,
    },
  ];
}
