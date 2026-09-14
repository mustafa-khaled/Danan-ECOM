"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/features/admin/api/fetch-admin-clients";
import { fetchAdminClasses } from "@/features/admin/api/fetch-admin-classes";
import type { AdminClass } from "@/features/admin/types";

export default function NewMemberPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [classId, setClassId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchAdminClasses().then((items) => {
      setClasses(items.filter((cls) => cls.isActive));
      const fallback = items.find((cls) => cls.isDefault);
      if (fallback) setClassId(fallback.id);
    });
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await createClient({
        displayName,
        email,
        phone: phone || undefined,
        classId: classId || undefined,
      });
      router.push(`/admin/members/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create member");
      setSaving(false);
    }
  };

  return (
    <div className="px-7.5 py-[16px]">
      <div className="p-6 bg-white rounded-3xl space-y-6">
        <h1 className="font-heading text-[32px] font-bold text-[#212630]">
          New member
        </h1>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <form onSubmit={onSubmit} className="grid gap-4 max-w-xl">
          <label className="space-y-1">
            <span className="text-[#272D35] text-h6 font-medium">Display name</span>
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="border-none bg-[#F8FAFC] h-14 w-full p-[16px]"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[#272D35] text-h6 font-medium">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-none bg-[#F8FAFC] h-14 w-full p-[16px]"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[#272D35] text-h6 font-medium">Phone</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border-none bg-[#F8FAFC] h-14 w-full p-[16px]"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[#272D35] text-h6 font-medium">Class</span>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="border-none bg-[#F8FAFC] h-14 w-full p-[16px]"
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
            type="submit"
            disabled={saving}
            className="w-32 h-11 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white"
          >
            {saving ? "Saving…" : "Create"}
          </button>
        </form>
      </div>
    </div>
  );
}
