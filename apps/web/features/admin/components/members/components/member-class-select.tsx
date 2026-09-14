"use client";

import { useEffect, useState } from "react";
import { fetchAdminClientDetail, updateClient } from "@/features/admin/api/fetch-admin-clients";
import { fetchAdminClasses } from "@/features/admin/api/fetch-admin-classes";
import type { AdminClass } from "@/features/admin/types";

interface MemberClassSelectProps {
  memberId: string;
}

export default function MemberClassSelect({ memberId }: MemberClassSelectProps) {
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [classId, setClassId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void Promise.all([
      fetchAdminClasses(),
      fetchAdminClientDetail(memberId),
    ]).then(([cls, client]) => {
      setClasses(cls.filter((item) => item.isActive || item.id === client.class?.id));
      setClassId(client.class?.id ?? "");
    });
  }, [memberId]);

  const onSave = async () => {
    if (!classId) return;
    setSaving(true);
    setError(null);
    try {
      await updateClient(memberId, { classId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update class");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex items-end gap-3">
        <label className="flex-1 space-y-2">
          <span className="text-[#272D35] text-h6 font-medium">Membership class</span>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="border-none bg-[#F8FAFC] h-17.5 w-full p-[16px]"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
                {cls.isDefault ? " (default)" : ""}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={saving}
          className="w-24 h-11 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white"
        >
          {saving ? "…" : "Save"}
        </button>
      </div>
    </div>
  );
}
