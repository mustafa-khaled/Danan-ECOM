"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LuxuryButton } from "@/components/ui";
import type { AdminClientDetail } from "@/features/admin/types";
import {
  createClient,
  updateClient,
} from "@/features/admin/api/fetch-admin-clients";
import {
  createClientSchema,
  type CreateClientFormValues,
} from "@/features/admin/schemas";

interface ClientFormProps {
  client?: AdminClientDetail | null;
  mode: "create" | "edit";
}

const inputClassName = "w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none";
const labelClassName = "mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--color-ivory-muted)]";
const errorClassName = "mt-1 text-xs text-red-500";

export function ClientForm({ client, mode }: ClientFormProps) {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const defaultValues: CreateClientFormValues = {
    displayName: client?.displayName ?? "",
    email: client?.email ?? "",
    phone: "",
    locale: "ar",
    visibilityGroups: client?.visibilityGroups?.join(", ") ?? "",
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateClientFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createClientSchema) as any,
    defaultValues,
  });

  const onSubmit = async (data: CreateClientFormValues) => {
    setApiError(null);

    try {
      const { visibilityGroups, ...rest } = data;
      const payload = {
        ...rest,
        visibilityGroups: typeof visibilityGroups === "string"
          ? visibilityGroups.split(",").map((g) => g.trim()).filter(Boolean)
          : visibilityGroups,
      };

      if (mode === "create") {
        await createClient(payload as Parameters<typeof createClient>[0]);
      } else {
        await updateClient(client!.id, payload as Parameters<typeof updateClient>[1]);
      }

      router.push("/admin/clients");
      router.refresh();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : `Failed to ${mode} client`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {apiError && (
        <div className="rounded-[var(--radius-panel)] border border-red-500/40 bg-red-500/10 p-4">
          <p className="text-red-500" role="alert">{apiError}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label htmlFor="client-displayName" className={labelClassName}>Display Name</label>
            <input
              id="client-displayName"
              type="text"
              {...register("displayName")}
              className={inputClassName}
            />
            {errors.displayName && <p className={errorClassName}>{errors.displayName.message}</p>}
          </div>

          <div>
            <label htmlFor="client-email" className={labelClassName}>Email</label>
            <input
              id="client-email"
              type="email"
              {...register("email")}
              className={inputClassName}
            />
            {errors.email && <p className={errorClassName}>{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="client-phone" className={labelClassName}>Phone</label>
            <input
              id="client-phone"
              type="tel"
              {...register("phone")}
              className={inputClassName}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="client-locale" className={labelClassName}>Preferred Language</label>
            <select id="client-locale" {...register("locale")} className={inputClassName}>
              <option value="ar">Arabic</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label htmlFor="client-visibilityGroups" className={labelClassName}>Visibility Groups</label>
            <input
              id="client-visibilityGroups"
              type="text"
              {...register("visibilityGroups")}
              placeholder="vip, premium (comma separated)"
              className={inputClassName}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <LuxuryButton type="submit" loading={isSubmitting}>
          {mode === "create" ? "Create Client" : "Save Changes"}
        </LuxuryButton>

        <LuxuryButton
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/clients")}
        >
          Cancel
        </LuxuryButton>
      </div>
    </form>
  );
}
