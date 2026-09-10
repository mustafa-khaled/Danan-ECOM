"use client";

import { type ColumnDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/Badge";
import { PaymentRowActions } from "./payment-row-actions";
import type { AdminPaymentListItem } from "../types";

const statusVariant: Record<string, "success" | "warning" | "error"> = {
  PAID: "success",
  PENDING: "warning",
  FAILED: "error",
};

const methodLabels: Record<string, string> = {
  CARD: "Card",
  MADA: "Mada",
  APPLE_PAY: "Apple Pay",
};

export const paymentsColumns: ColumnDef<AdminPaymentListItem>[] = [
  {
    key: "id",
    label: "Transaction",
    accessor: "id",
    width: "160px",
    render: (value) => {
      const id = String(value);
      return (
        <span className="font-mono text-xs text-neutral-700">
          {id.length > 12 ? `${id.slice(0, 8)}...` : id}
        </span>
      );
    },
  },
  {
    key: "client",
    label: "Member",
    accessor: (row) => row.client.displayName,
    width: "200px",
    render: (_, row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xs font-semibold text-neutral-700 shrink-0">
          {row.client.displayName
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-sm text-neutral-900 truncate">
            {row.client.displayName}
          </span>
          <span className="text-xs text-neutral-400 truncate">
            {row.client.email}
          </span>
        </div>
      </div>
    ),
  },
  {
    key: "pieces",
    label: "Piece",
    accessor: (row) => row.items.map((i) => i.piece.serialNumber).join(", "),
    width: "160px",
    render: (_, row) => {
      const serials = row.items.map((i) => i.piece.serialNumber);
      return (
        <div className="flex flex-wrap gap-1">
          {serials.map((s) => (
            <span
              key={s}
              className="inline-flex items-center px-2 py-0.5 rounded bg-[#F8FAFC] border border-neutral-200 text-[10px] font-mono text-neutral-600"
            >
              {s}
            </span>
          ))}
        </div>
      );
    },
  },
  {
    key: "totalAmount",
    label: "Amount",
    accessor: "totalAmount",
    width: "120px",
    align: "right",
    render: (value) => (
      <span className="text-sm font-medium text-neutral-900">
        SAR {Number(value).toLocaleString()}
      </span>
    ),
  },
  {
    key: "paymentMethod",
    label: "Method",
    accessor: "paymentMethod",
    width: "110px",
    align: "center",
    render: (value) => {
      const method = String(value);
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]">
          {methodLabels[method] ?? method}
        </span>
      );
    },
  },
  {
    key: "placedAt",
    label: "Date",
    accessor: "placedAt",
    width: "130px",
    render: (value) => (
      <span className="text-xs text-neutral-600">{String(value)}</span>
    ),
  },
  {
    key: "paymentStatus",
    label: "Status",
    accessor: "paymentStatus",
    width: "110px",
    align: "center",
    render: (value) => {
      const status = String(value);
      const variant = statusVariant[status] ?? "outline";
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    key: "actions",
    label: "Action",
    width: "90px",
    align: "right",
    hideable: false,
    render: (_, row) => <PaymentRowActions payment={row} />,
  },
];
