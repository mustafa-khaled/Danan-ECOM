"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateClient } from "@/features/admin/api/fetch-admin-clients";

interface MemberOverviewFormProps {
  memberId: string;
  houseId: string;
  email: string;
  joined: string;
  lastActive: string;
}

export function MemberOverviewForm({
  memberId,
  houseId,
  email,
  joined,
  lastActive,
}: MemberOverviewFormProps) {
  const router = useRouter();
  const [value, setValue] = useState(email);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateClient(memberId, { email: value });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="memberId"
            className="text-[#272D35] text-h6 font-medium"
          >
            Member ID
          </label>
          <input
            type="text"
            name="memberId"
            defaultValue={houseId}
            readOnly
            placeholder="Enter Member ID"
            id="memberId"
            className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-[#272D35] text-h6 font-medium">
            Email
          </label>
          <input
            type="text"
            name="email"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter Email"
            id="email"
            className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="joinedDate"
            className="text-[#272D35] text-h6 font-medium"
          >
            Joined
          </label>
          <input
            type="text"
            name="joinedDate"
            defaultValue={joined}
            readOnly
            placeholder="Enter joined date"
            id="joinedDate"
            className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="lastActive"
            className="text-[#272D35] text-h6 font-medium"
          >
            Last Active
          </label>
          <input
            type="text"
            name="lastActive"
            defaultValue={lastActive}
            readOnly
            placeholder="Enter last active"
            id="lastActive"
            className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
          />
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <div className="flex items-center justify-end gap-3 w-full mt-[16px]">
        <button
          type="button"
          className="w-24 h-11 border border-[#EAE7E4] rounded-lg text-[14px] font-medium text-[#141210]"
        >
          Edit
        </button>
        <button
          type="submit"
          disabled={saving}
          className="w-24 h-11 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
