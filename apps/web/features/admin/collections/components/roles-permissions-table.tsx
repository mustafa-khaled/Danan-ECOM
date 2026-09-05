"use client";

import { useState } from "react";
import { DataTable, type ColumnDef } from "@/components/ui";
import { Pencil, Trash2, Check } from "lucide-react";

export interface RolePermissionRow {
  id: string;
  name: string;
  superAdmin: boolean;
  admin: boolean;
  creator: boolean;
  operations: boolean;
}

const defaultRolePermissions: RolePermissionRow[] = [
  {
    id: "collections",
    name: "Collections",
    superAdmin: true,
    admin: true,
    creator: true,
    operations: false,
  },
  {
    id: "stories",
    name: "Stories",
    superAdmin: true,
    admin: true,
    creator: true,
    operations: false,
  },
  {
    id: "members",
    name: "Members",
    superAdmin: true,
    admin: true,
    creator: false,
    operations: true,
  },
  {
    id: "settings",
    name: "Settings",
    superAdmin: true,
    admin: false,
    creator: false,
    operations: false,
  },
];

const columns: ColumnDef<RolePermissionRow>[] = [
  {
    key: "name",
    label: "Permission",
    accessor: "name",
    cellClassName: "font-medium text-[#272D35] text-[15px] w-[352px]",
  },
  {
    key: "superAdmin",
    label: "Super Admin",
    align: "center",
    render: (_, row) => (
      <div className="flex justify-center">
        <span
          className={`w-[16px] h-[16px] rounded-full flex items-center justify-center text-white ${
            row.superAdmin ? "bg-[#1EC58B]" : "bg-[#D1D5DB]"
          }`}
        >
          <Check className="size-3" />
        </span>
      </div>
    ),
  },
  {
    key: "admin",
    label: "Admin",
    align: "center",
    render: (_, row) => (
      <div className="flex justify-center">
        <span
          className={`w-[16px] h-[16px] rounded-full flex items-center justify-center text-white ${
            row.admin ? "bg-[#1EC58B]" : "bg-[#D1D5DB]"
          }`}
        >
          <Check className="size-3" />
        </span>
      </div>
    ),
  },
  {
    key: "creator",
    label: "Creator",
    align: "center",
    render: (_, row) => (
      <div className="flex justify-center">
        <span
          className={`w-[16px] h-[16px] rounded-full flex items-center justify-center text-white ${
            row.creator ? "bg-[#1EC58B]" : "bg-[#D1D5DB]"
          }`}
        >
          <Check className="size-3" />
        </span>
      </div>
    ),
  },
  {
    key: "operations",
    label: "Operations",
    align: "center",
    render: (_, row) => (
      <div className="flex justify-center">
        <span
          className={`w-[16px] h-[16px] rounded-full flex items-center justify-center text-white ${
            row.operations ? "bg-[#1EC58B]" : "bg-[#D1D5DB]"
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

interface RolesPermissionsTableProps {
  initialData?: RolePermissionRow[];
}

export default function RolesPermissionsTable({
  initialData = defaultRolePermissions,
}: RolesPermissionsTableProps) {
  const [permissions] = useState<RolePermissionRow[]>(initialData);

  return (
    <div className="py-[32px]">
      <h4 className="font-heading text-[32px] font-bold">
        Roles & Permissions
      </h4>
      <p className="font-medium text-[#5D697A] text-h5 my-[16px]">
        Manage what each admin role can access and manage inside the DADAN Admin.
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
                emptyMessage="Define what each admin role can access."
              />
            </DataTable.Table>
          </DataTable.Container>
        </DataTable>
      </div>
    </div>
  );
}
