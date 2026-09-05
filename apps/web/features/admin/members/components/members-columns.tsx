"use client";

import Link from "next/link";
import { type ColumnDef } from "@/components/ui/data-table";
import { StatusPill } from "@/components/ui/StatusPill";
import { Eye, Pencil } from "lucide-react";
import type { MemberListItem, MembershipClass } from "../types";

const classBadgeVariant: Record<
  MembershipClass,
  { bg: string; text: string; border: string }
> = {
  "Class A": {
    bg: "bg-[#FDF7E7]",
    text: "text-[#B45309]",
    border: "border-[#FDE68A]",
  },
  "Class B": {
    bg: "bg-[#EBFAF0]",
    text: "text-[#166534]",
    border: "border-[#BBF7D0]",
  },
  "Class C": {
    bg: "bg-[#F3F4F6]",
    text: "text-[#4B5563]",
    border: "border-[#E5E7EB]",
  },
};

export const membersColumns: ColumnDef<MemberListItem>[] = [
  {
    key: "name",
    label: "Member name",
    accessor: "name",
    width: "182px",
    render: (_, row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xs font-semibold text-neutral-700 shrink-0">
          {row.name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </div>
        <div className="flex flex-col min-w-0">
          <Link
            href={`/admin/members/${row.id}`}
            className="font-medium text-sm text-neutral-900 hover:text-warm-600 transition-colors truncate"
          >
            {row.name}
          </Link>
          <span className="text-xs text-neutral-400 truncate">{row.email}</span>
        </div>
      </div>
    ),
  },
  {
    key: "membershipClass",
    label: "Class",
    accessor: "membershipClass",
    width: "60px",
    align: "center",
    render: (value) => {
      const cls = (value as MembershipClass) || "Class C";
      const style = classBadgeVariant[cls] || classBadgeVariant["Class C"];
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}
        >
          {cls}
        </span>
      );
    },
  },
  {
    key: "status",
    label: "Status",
    accessor: "status",
    width: "120px",
    align: "center",
    render: (value) => {
      const status = String(value);
      return <StatusPill status={status} />;
    },
  },
  {
    key: "ownedPiecesCount",
    label: "Owned Pieces",
    accessor: "ownedPiecesCount",
    width: "130px",
    align: "center",
    render: (value) => {
      const count = Number(value) || 0;
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-neutral-200 text-xs font-medium text-neutral-700">
          <span className="font-semibold text-neutral-900">{count}</span>
          <span>{count === 1 ? "Piece" : "Pieces"}</span>
        </span>
      );
    },
  },
  {
    key: "houseKeyActive",
    label: "House Key",
    accessor: "houseKeyActive",
    width: "130px",
    align: "center",
    render: (value) => {
      const active = Boolean(value);
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
            active
              ? "bg-[#EBFAF0] text-[#166534] border border-[#BBF7D0]"
              : "bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              active ? "bg-[#36C76C]" : "bg-[#9CA3AF]"
            }`}
          />
          {active ? "Active" : "Inactive"}
        </span>
      );
    },
  },
  {
    key: "joinedDate",
    label: "Joined Date",
    accessor: "joinedDate",
    width: "130px",
    render: (value) => (
      <span className="text-xs text-neutral-600">{String(value)}</span>
    ),
  },
  {
    key: "lastActive",
    label: "Last active",
    accessor: "lastActive",
    width: "130px",
    render: (value) => (
      <span className="text-xs text-neutral-500">{String(value)}</span>
    ),
  },
  {
    key: "actions",
    label: "Actions",
    width: "110px",
    align: "right",
    hideable: false,
    render: (_, row) => (
      <div className="flex items-center justify-end gap-1">
        <Link
          href={`/admin/members/${row.id}`}
          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          title="View member details"
          aria-label={`View details for ${row.name}`}
        >
          <Eye className="size-4" />
        </Link>
        <Link
          href={`/admin/members/${row.id}/edit`}
          className="p-1.5 text-neutral-500 hover:text-warm-600 hover:bg-warm-50 rounded-lg transition-colors"
          title="Edit member"
          aria-label={`Edit ${row.name}`}
        >
          <Pencil className="size-4" />
        </Link>
      </div>
    ),
  },
];
