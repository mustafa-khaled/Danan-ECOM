"use client";

import { useState } from "react";
import { DataTable, type ColumnDef } from "@/components/ui";
import { Pencil, Trash2, Check } from "lucide-react";

export interface MembershipPermissionRow {
  id: string;
  name: string;
  classA: boolean;
  classB: boolean;
  classC: boolean;
}

const defaultMembershipPermissions: MembershipPermissionRow[] = [
  {
    id: "collection-x-1",
    name: "Collection X",
    classA: true,
    classB: true,
    classC: true,
  },
  {
    id: "collection-y-1",
    name: "Collection y",
    classA: true,
    classB: true,
    classC: false,
  },
  {
    id: "collection-x-2",
    name: "Collection X",
    classA: true,
    classB: false,
    classC: false,
  },
  {
    id: "collection-y-2",
    name: "Collection y",
    classA: true,
    classB: true,
    classC: false,
  },
  {
    id: "collection-x-3",
    name: "Collection X",
    classA: true,
    classB: false,
    classC: false,
  },
];

const columns: ColumnDef<MembershipPermissionRow>[] = [
  {
    key: "name",
    label: "Permission",
    accessor: "name",
    cellClassName: "font-medium text-[#272D35] text-[15px] w-[352px]",
  },
  {
    key: "classA",
    label: "Class A",
    align: "center",
    render: (_, row) => (
      <div className="flex justify-center">
        <span
          className={`w-[16px] h-[16px] rounded-full flex items-center justify-center text-white ${
            row.classA ? "bg-[#1EC58B]" : "bg-[#D1D5DB]"
          }`}
        >
          <Check className="size-3" />
        </span>
      </div>
    ),
  },
  {
    key: "classB",
    label: "Class B",
    align: "center",
    render: (_, row) => (
      <div className="flex justify-center">
        <span
          className={`w-[16px] h-[16px] rounded-full flex items-center justify-center text-white ${
            row.classB ? "bg-[#1EC58B]" : "bg-[#D1D5DB]"
          }`}
        >
          <Check className="size-3" />
        </span>
      </div>
    ),
  },
  {
    key: "classC",
    label: "Class C",
    align: "center",
    render: (_, row) => (
      <div className="flex justify-center">
        <span
          className={`w-[16px] h-[16px] rounded-full flex items-center justify-center text-white ${
            row.classC ? "bg-[#1EC58B]" : "bg-[#D1D5DB]"
          }`}
        >
          <Check className="size-3" />
        </span>
      </div>
    ),
  },
  {
    key: "actions",
    label: "Actions",
    align: "right",
    hideable: false,
    render: (_, row) => (
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          className="p-2 text-[#5D697A] hover:text-[#BF7266] hover:bg-[#F8FAFC] rounded-lg transition-colors"
          title="Edit permission"
          aria-label={`Edit ${row.name}`}
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          type="button"
          className="p-2 text-[#5D697A] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete permission"
          aria-label={`Delete ${row.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    ),
  },
];

interface MembershipPermissionsTableProps {
  initialData?: MembershipPermissionRow[];
}

export default function MembershipPermissionsTable({
  initialData = defaultMembershipPermissions,
}: MembershipPermissionsTableProps) {
  const [permissions] = useState<MembershipPermissionRow[]>(initialData);

  return (
    <div className="py-[32px] border-b border-[#E1E4E8]">
      <h4 className="font-heading text-[32px] font-bold">
        Membership Classes
      </h4>
      <p className="font-medium text-[#5D697A] text-h5 my-[16px]">
        Define what each member class can access and do inside the DADAN House.
      </p>

      <div className="mt-6">
        <DataTable
          data={permissions}
          columns={columns}
          keyExtractor={(row) => row.id}
          hoverable
        >
          <DataTable.Container>
            <DataTable.Table>
              <DataTable.Header />
              <DataTable.Body
                emptyTitle="No permissions defined"
                emptyMessage="Define what each member class can access."
              />
            </DataTable.Table>
          </DataTable.Container>
        </DataTable>
      </div>
    </div>
  );
}
