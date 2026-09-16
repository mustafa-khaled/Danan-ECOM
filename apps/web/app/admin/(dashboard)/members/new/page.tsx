"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/features/admin/api/fetch-admin-clients";
import { fetchAdminClasses } from "@/features/admin/api/fetch-admin-classes";
import {
  createClientSchema,
  type CreateClientFormValues,
} from "@/features/admin/schemas";
import type { AdminClass } from "@/features/admin/types";
import { defaultLocale } from "@/i18n/routing";

const inputClassName = "border-none bg-[#F8FAFC] h-14 w-full p-[16px]";
const errorClassName = "mt-1 text-xs text-red-500";

export default function NewMemberPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<AdminClass[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateClientFormValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: { locale: defaultLocale },
  });

  useEffect(() => {
    void fetchAdminClasses().then((items) => {
      const active = items.filter((cls) => cls.isActive);
      setClasses(active);
      const fallback = active.find((cls) => cls.isDefault);
      if (fallback) setValue("classId", fallback.id);
    });
  }, [setValue]);

  const onSubmit = async (data: CreateClientFormValues) => {
    const created = await createClient({
      displayName: data.displayName,
      email: data.email,
      phone: data.phone || undefined,
      locale: data.locale,
      classId: data.classId || undefined,
    });
    router.push(`/admin/members/${created.id}`);
  };

  return (
    <div className="px-7.5 py-[16px]">
      <div className="p-6 bg-white rounded-3xl space-y-6">
        <h1 className="font-heading text-[32px] font-bold text-[#212630]">
          New member
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 max-w-xl">
          <div className="space-y-1">
            <span className="text-[#272D35] text-h6 font-medium">Display name</span>
            <input
              {...register("displayName")}
              className={inputClassName}
              placeholder="Full name"
            />
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
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className={errorClassName}>{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-[#272D35] text-h6 font-medium">Phone</span>
            <input
              {...register("phone")}
              className={inputClassName}
              placeholder="+966 5xx xxx xxxx"
            />
            {errors.phone && (
              <p className={errorClassName}>{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-[#272D35] text-h6 font-medium">Class</span>
            <select
              {...register("classId")}
              className={inputClassName}
            >
              <option value="">— Select class —</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                  {cls.isDefault ? " (default)" : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-32 h-11 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Create"}
          </button>
        </form>
      </div>
    </div>
  );
}
