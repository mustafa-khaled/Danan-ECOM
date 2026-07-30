"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LuxuryButton } from "@/components/ui";
import { registerPiece } from "@/features/admin/api/fetch-admin-pieces";
import type { AdminDesignListItem } from "@/features/admin/types";

const registerPieceSchema = z.object({
  designId: z.string().uuid("Select a design"),
  notes: z.string().optional(),
  initialClientId: z.string().optional(),
});

type RegisterPieceFormValues = z.infer<typeof registerPieceSchema>;

interface RegisterPieceFormProps {
  designs: AdminDesignListItem[];
}

const inputClassName = "w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none";
const labelClassName = "mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--color-ivory-muted)]";
const errorClassName = "mt-1 text-xs text-red-500";

export function RegisterPieceForm({ designs }: RegisterPieceFormProps) {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterPieceFormValues>({
    resolver: zodResolver(registerPieceSchema),
    defaultValues: { designId: "", notes: "", initialClientId: "" },
  });

  const onSubmit = async (data: RegisterPieceFormValues) => {
    setApiError(null);

    try {
      await registerPiece({
        designId: data.designId,
        notes: data.notes || undefined,
        initialClientId: data.initialClientId || undefined,
      });

      router.push("/admin/pieces");
      router.refresh();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to register piece");
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
        <div>
          <label htmlFor="piece-designId" className={labelClassName}>Design</label>
          <select id="piece-designId" {...register("designId")} className={inputClassName}>
            <option value="">Select a design</option>
            {designs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.collectionName ?? d.collectionId})
              </option>
            ))}
          </select>
          {errors.designId && <p className={errorClassName}>{errors.designId.message}</p>}
        </div>

        <div>
          <label htmlFor="piece-initialClientId" className={labelClassName}>
            Initial Client ID (optional)
          </label>
          <input
            id="piece-initialClientId"
            type="text"
            {...register("initialClientId")}
            placeholder="Leave empty to register without assignment"
            className={inputClassName}
          />
        </div>
      </div>

      <div>
        <label htmlFor="piece-notes" className={labelClassName}>Notes (optional)</label>
        <textarea
          id="piece-notes"
          {...register("notes")}
          rows={3}
          className={inputClassName}
        />
      </div>

      <div className="flex gap-4">
        <LuxuryButton type="submit" loading={isSubmitting}>
          Register Piece
        </LuxuryButton>
        <LuxuryButton
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/pieces")}
        >
          Cancel
        </LuxuryButton>
      </div>
    </form>
  );
}
