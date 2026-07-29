"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LuxuryButton } from "@/components/ui";
import type { AdminDesignListItem, AdminCollectionListItem } from "@/features/admin/types";
import {
  createDesign,
  updateDesign,
  deleteDesign,
} from "@/features/admin/api/fetch-admin-collections";
import {
  createDesignSchema,
  updateDesignSchema,
  type CreateDesignFormValues,
  type UpdateDesignFormValues,
} from "@/features/admin/schemas";

interface DesignFormProps {
  design?: AdminDesignListItem | null;
  collections: AdminCollectionListItem[];
  mode: "create" | "edit";
}

const inputClassName = "w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none";
const labelClassName = "mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--color-ivory-muted)]";
const errorClassName = "mt-1 text-xs text-red-500";

export function DesignForm({ design, collections, mode }: DesignFormProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  type DesignFormValues = CreateDesignFormValues | UpdateDesignFormValues;

  const defaultValues: DesignFormValues = mode === "create"
    ? {
        name: "",
        nameAr: "",
        slug: "",
        collectionId: "",
        story: "",
        storyAr: "",
        material: "",
        materialAr: "",
        weight: 0,
        dimensions: "",
        dimensionsAr: "",
        basePrice: 0,
        currency: "SAR",
        isActive: true,
        visibilityGroups: "",
      }
    : {
        name: design?.name ?? "",
        nameAr: design?.nameAr ?? "",
        slug: design?.slug ?? "",
        collectionId: design?.collectionId ?? "",
        material: design?.material ?? "",
        materialAr: design?.materialAr ?? "",
        weight: Number(design?.weight ?? 0),
        dimensions: design?.dimensions ?? "",
        dimensionsAr: design?.dimensionsAr ?? "",
        basePrice: Number(design?.basePrice ?? 0),
        currency: (design?.currency ?? "SAR") as "SAR" | "USD" | "EUR",
        isActive: design?.isActive ?? true,
        visibilityGroups: design?.visibilityGroups?.join(", ") ?? "",
      };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DesignFormValues>({
    resolver: zodResolver(
      mode === "create" ? createDesignSchema : updateDesignSchema,
    ) as Resolver<DesignFormValues>,
    defaultValues,
  });

  const onSubmit = async (data: DesignFormValues) => {
    setApiError(null);

    try {
      if (mode === "create") {
        const { visibilityGroups, ...rest } = data as CreateDesignFormValues;
        await createDesign({
          ...rest,
          materialAr: rest.materialAr || undefined,
          dimensionsAr: rest.dimensionsAr || undefined,
          visibilityGroups: typeof visibilityGroups === "string"
            ? visibilityGroups.split(",").map((g) => g.trim()).filter(Boolean)
            : visibilityGroups,
        });
      } else {
        const { visibilityGroups, ...rest } = data as UpdateDesignFormValues;
        await updateDesign(design!.id, {
          ...rest,
          materialAr: rest.materialAr || undefined,
          dimensionsAr: rest.dimensionsAr || undefined,
          visibilityGroups: typeof visibilityGroups === "string"
            ? visibilityGroups.split(",").map((g) => g.trim()).filter(Boolean)
            : visibilityGroups,
        });
      }

      router.push("/admin/designs");
      router.refresh();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : `Failed to ${mode} design`);
    }
  };

  const handleDelete = async () => {
    if (!design || !confirm("Are you sure you want to delete this design? This cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    setApiError(null);

    try {
      await deleteDesign(design.id);
      router.push("/admin/designs");
      router.refresh();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to delete design");
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {apiError && (
        <div className="rounded-[var(--radius-panel)] border border-red-500/40 bg-red-500/10 p-4">
          <p className="text-red-500">{apiError}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className={labelClassName}>Name (English)</label>
            <input
              type="text"
              {...register("name")}
              className={inputClassName}
            />
            {errors.name && <p className={errorClassName}>{errors.name.message}</p>}
          </div>

          <div>
            <label className={labelClassName}>Name (Arabic)</label>
            <input
              type="text"
              {...register("nameAr")}
              dir="rtl"
              className={inputClassName}
            />
            {errors.nameAr && <p className={errorClassName}>{errors.nameAr.message}</p>}
          </div>

          <div>
            <label className={labelClassName}>Slug</label>
            <input
              type="text"
              {...register("slug")}
              className={inputClassName}
            />
            {errors.slug && <p className={errorClassName}>{errors.slug.message}</p>}
          </div>

          <div>
            <label className={labelClassName}>Collection</label>
            <select {...register("collectionId")} className={inputClassName}>
              <option value="">Select a collection</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.collectionId && <p className={errorClassName}>{errors.collectionId.message}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClassName}>Material (English)</label>
            <input
              type="text"
              {...register("material")}
              className={inputClassName}
            />
            {errors.material && <p className={errorClassName}>{errors.material.message}</p>}
          </div>

          <div>
            <label className={labelClassName}>Material (Arabic)</label>
            <input
              type="text"
              {...register("materialAr")}
              dir="rtl"
              className={inputClassName}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>Weight (grams)</label>
              <input
                type="number"
                step="0.001"
                {...register("weight")}
                className={inputClassName}
              />
              {errors.weight && <p className={errorClassName}>{errors.weight.message}</p>}
            </div>
            <div>
              <label className={labelClassName}>Dimensions</label>
              <input
                type="text"
                {...register("dimensions")}
                placeholder="e.g., 2.5 x 1.5 cm"
                className={inputClassName}
              />
              {errors.dimensions && <p className={errorClassName}>{errors.dimensions.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>Base Price</label>
              <input
                type="number"
                step="0.01"
                {...register("basePrice")}
                className={inputClassName}
              />
              {errors.basePrice && <p className={errorClassName}>{errors.basePrice.message}</p>}
            </div>
            <div>
              <label className={labelClassName}>Currency</label>
              <select {...register("currency")} className={inputClassName}>
                <option value="SAR">SAR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {mode === "create" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <label className={labelClassName}>Story (English)</label>
            <textarea
              {...register("story" as keyof CreateDesignFormValues)}
              rows={4}
              className={inputClassName}
            />
            {"story" in errors && errors.story && (
              <p className={errorClassName}>{errors.story.message}</p>
            )}
          </div>
          <div>
            <label className={labelClassName}>Story (Arabic)</label>
            <textarea
              {...register("storyAr" as keyof CreateDesignFormValues)}
              rows={4}
              dir="rtl"
              className={inputClassName}
            />
            {"storyAr" in errors && errors.storyAr && (
              <p className={errorClassName}>{errors.storyAr.message}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <label className={labelClassName}>Visibility Groups</label>
          <input
            type="text"
            {...register("visibilityGroups")}
            placeholder="vip, premium (comma separated)"
            className={inputClassName}
          />
        </div>

        <div className="flex items-end">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              {...register("isActive")}
              className="h-5 w-5 rounded border-[var(--color-border)] bg-[var(--color-surface)] accent-[var(--color-accent)]"
            />
            <span className="text-sm">Design is active</span>
          </label>
        </div>
      </div>

      <div className="flex gap-4">
        <LuxuryButton type="submit" loading={isSubmitting}>
          {mode === "create" ? "Create Design" : "Save Changes"}
        </LuxuryButton>

        <LuxuryButton
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/designs")}
        >
          Cancel
        </LuxuryButton>

        {mode === "edit" && (
          <LuxuryButton
            type="button"
            variant="ghost"
            onClick={handleDelete}
            loading={isDeleting}
            className="ms-auto border-red-500 text-red-500 hover:bg-red-500/10"
          >
            Delete Design
          </LuxuryButton>
        )}
      </div>
    </form>
  );
}
