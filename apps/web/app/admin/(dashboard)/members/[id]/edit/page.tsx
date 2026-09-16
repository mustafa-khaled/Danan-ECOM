"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  fetchAdminClientDetail,
  updateClient,
} from "@/features/admin/api/fetch-admin-clients";
import { fetchAdminClasses } from "@/features/admin/api/fetch-admin-classes";
import {
  updateClientSchema,
  type UpdateClientFormValues,
} from "@/features/admin/schemas";
import type { AdminClass, AdminClientDetail } from "@/features/admin/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const inputClassName = "border-none bg-[#F8FAFC] h-14 w-full p-[16px]";
const errorClassName = "mt-1 text-xs text-red-500";

export default function EditMemberPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [member, setMember] = useState<AdminClientDetail | null>(null);
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateClientFormValues>({
    resolver: zodResolver(updateClientSchema),
  });

  useEffect(() => {
    void Promise.all([
      fetchAdminClientDetail(id),
      fetchAdminClasses(),
    ])
      .then(([memberData, classData]) => {
        setMember(memberData);
        const active = classData.filter((cls) => cls.isActive);
        setClasses(active);
        setValue("displayName", memberData.displayName);
        setValue("email", memberData.email);
        setValue("phone", memberData.phone ?? "");
        setValue("isActive", memberData.isActive);
        if (memberData.class?.id) setValue("classId", memberData.class.id);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Failed to load member");
      });
  }, [id, setValue]);

  const onSubmit = async (data: UpdateClientFormValues) => {
    await updateClient(id, {
      displayName: data.displayName,
      email: data.email,
      phone: data.phone || undefined,
      isActive: data.isActive,
      classId: data.classId || undefined,
    });
    router.push(`/admin/members/${id}`);
    router.refresh();
  };

  if (loadError) {
    return (
      <div className="px-7.5 py-[16px]">
        <p className="text-red-500">{loadError}</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="px-7.5 py-[16px]">
        <p className="text-[#5D697A]">Loading…</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-[16px] px-7.5 py-3 [&>div]:rounded-xl [&>div]:h-15.5 [&>div]:bg-white">
        <div className="flex items-center justify-center w-15.5">
          <Link href={`/admin/members/${id}`}>
            <ArrowLeft className="size-6 rtl:rotate-180" />
          </Link>
        </div>
        <div className="w-full px-7.5 flex items-center">
          <h4 className="font-bold text-h6 text-neutral-800">Edit Member</h4>
        </div>
      </div>

      <div className="px-7.5 py-[16px]">
        <div className="p-6 bg-white rounded-3xl space-y-6">
          <h1 className="font-heading text-[32px] font-bold text-[#212630] border-b border-[#E1E4E8] pb-[32px]">
            {member.displayName}
          </h1>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-4 max-w-xl"
          >
            <div className="space-y-1">
              <span className="text-[#272D35] text-h6 font-medium">
                Display name
              </span>
              <input {...register("displayName")} className={inputClassName} />
              {errors.displayName && (
                <p className={errorClassName}>{errors.displayName.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[#272D35] text-h6 font-medium">Email</span>
              <input
                type="email"
                {...register("email")}
                className={inputClassName}
              />
              {errors.email && (
                <p className={errorClassName}>{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[#272D35] text-h6 font-medium">Phone</span>
              <input {...register("phone")} className={inputClassName} />
            </div>

            <div className="space-y-1">
              <span className="text-[#272D35] text-h6 font-medium">Class</span>
              <select {...register("classId")} className={inputClassName}>
                <option value="">— No class —</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                    {cls.isDefault ? " (default)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register("isActive")}
                className="h-4 w-4"
              />
              <span className="text-[#272D35] text-h6 font-medium">
                Active
              </span>
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-32 h-11 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white disabled:opacity-60"
              >
                {isSubmitting ? "Saving…" : "Save"}
              </button>
              <Link
                href={`/admin/members/${id}`}
                className="w-24 h-11 border border-[#EAE7E4] rounded-lg text-[14px] font-medium text-[#141210] flex items-center justify-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
