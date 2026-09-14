"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable, type ColumnDef } from "@/components/ui";
import { Check } from "lucide-react";
import { fetchAdminClasses } from "@/features/admin/api/fetch-admin-classes";
import {
  fetchAdminCollections,
  updateCollection,
} from "@/features/admin/api/fetch-admin-collections";
import type { AdminClass, AdminCollectionListItem } from "@/features/admin/types";

export interface MembershipPermissionRow {
  id: string;
  name: string;
  classIds: string[];
}

export default function MembershipPermissionsTable() {
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [collections, setCollections] = useState<AdminCollectionListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [cls, cols] = await Promise.all([
        fetchAdminClasses(),
        fetchAdminCollections(1, 100),
      ]);
      setClasses(cls.filter((item) => item.isActive));
      setCollections(cols.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load access matrix");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows: MembershipPermissionRow[] = collections.map((col) => ({
    id: col.id,
    name: col.name,
    classIds: col.classes?.map((cls) => cls.id) ?? [],
  }));

  const toggle = useCallback(async (collectionId: string, classId: string) => {
    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) return;
    const current = collection.classes?.map((cls) => cls.id) ?? [];
    const classIds = current.includes(classId)
      ? current.filter((id) => id !== classId)
      : [...current, classId];
    try {
      await updateCollection(collectionId, { classIds });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update access");
    }
  }, [collections, load]);

  const columns = useMemo<ColumnDef<MembershipPermissionRow>[]>(() => {
    return [
      {
        key: "name",
        label: "Collection",
        accessor: "name",
        cellClassName: "font-medium text-[#272D35] text-[15px] w-[352px]",
      },
      ...classes.map((cls) => ({
        key: cls.id,
        label: cls.name,
        align: "center" as const,
        render: (_: unknown, row: MembershipPermissionRow) => (
          <button
            type="button"
            className="flex justify-center w-full"
            onClick={() => void toggle(row.id, cls.id)}
            aria-label={`${row.name} ${cls.name}`}
          >
            <span
              className={`w-[16px] h-[16px] rounded-full flex items-center justify-center text-white ${
                row.classIds.includes(cls.id) ? "bg-[#1EC58B]" : "bg-[#D1D5DB]"
              }`}
            >
              <Check className="size-3" />
            </span>
          </button>
        ),
      })),
    ];
  }, [classes, toggle]);

  return (
    <div className="py-[32px] border-b border-[#E1E4E8]">
      <h4 className="font-heading text-[32px] font-bold">
        Membership Classes
      </h4>
      <p className="font-medium text-[#5D697A] text-h5 my-[16px]">
        A collection is visible only to the classes checked here. Empty means no clients.
      </p>
      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      <div className="mt-6">
        <DataTable
          data={rows}
          columns={columns}
          keyExtractor={(row) => row.id}
          hoverable
        >
          <DataTable.Container>
            <DataTable.Table>
              <DataTable.Header />
              <DataTable.Body
                emptyTitle="No collections"
                emptyMessage="Create a collection to assign class access."
              />
            </DataTable.Table>
          </DataTable.Container>
        </DataTable>
      </div>
    </div>
  );
}
