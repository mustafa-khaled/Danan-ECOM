"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updatePiece } from "@/features/admin/api/fetch-admin-pieces";
import {
  updatePieceFormSchema,
  type UpdatePieceFormValues,
} from "@/features/admin/schemas";
import { useState } from "react";
import { useTranslations } from "next-intl";

const inputClassName =
  "w-full border-none bg-[#F8FAFC] h-12 px-4 text-[var(--color-text)]";
const labelClassName = "text-[#272D35] text-sm font-medium";
const errorClassName = "mt-1 text-xs text-red-500";

interface PieceEditFormProps {
  pieceId: string;
  initial: {
    name: string;
    nameAr: string;
    story: string;
    storyAr: string;
    material: string;
    materialAr: string;
    weight: string;
    dimensions: string;
    dimensionsAr: string;
    price: string;
    notes: string;
    isActive: boolean;
  };
}

export function PieceEditForm({ pieceId, initial }: PieceEditFormProps) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePieceFormValues>({
    resolver: zodResolver(updatePieceFormSchema),
    defaultValues: {
      name: initial.name,
      nameAr: initial.nameAr,
      story: initial.story,
      storyAr: initial.storyAr,
      material: initial.material,
      materialAr: initial.materialAr,
      weight: Number(initial.weight),
      dimensions: initial.dimensions,
      dimensionsAr: initial.dimensionsAr,
      price: Number(initial.price),
      notes: initial.notes,
    },
  });

  const onSubmit = async (data: UpdatePieceFormValues) => {
    setApiError(null);
    try {
      await updatePiece(pieceId, {
        name: data.name,
        nameAr: data.nameAr,
        story: data.story,
        storyAr: data.storyAr,
        material: data.material,
        materialAr: data.materialAr,
        weight: Number(data.weight),
        dimensions: data.dimensions,
        dimensionsAr: data.dimensionsAr,
        price: Number(data.price),
        notes: data.notes,
      });
      router.push(`/admin/pieces/${pieceId}`);
      router.refresh();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to update piece");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {apiError && <p className="text-sm text-red-500">{apiError}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className={labelClassName}>{t("common.nameEnglish")}</span>
          <input {...register("name")} className={inputClassName} />
          {errors.name && <p className={errorClassName}>{errors.name.message}</p>}
        </label>

        <label className="space-y-1">
          <span className={labelClassName}>{t("common.nameArabic")}</span>
          <input dir="rtl" {...register("nameAr")} className={inputClassName} />
          {errors.nameAr && <p className={errorClassName}>{errors.nameAr.message}</p>}
        </label>

        <label className="space-y-1">
          <span className={labelClassName}>{t("common.material")}</span>
          <input {...register("material")} className={inputClassName} />
          {errors.material && <p className={errorClassName}>{errors.material.message}</p>}
        </label>

        <label className="space-y-1">
          <span className={labelClassName}>{t("common.materialArabic")}</span>
          <input dir="rtl" {...register("materialAr")} className={inputClassName} />
        </label>

        <label className="space-y-1">
          <span className={labelClassName}>{t("common.weight")}</span>
          <input
            type="number"
            step="0.001"
            {...register("weight")}
            className={inputClassName}
          />
          {errors.weight && <p className={errorClassName}>{errors.weight.message}</p>}
        </label>

        <label className="space-y-1">
          <span className={labelClassName}>{t("common.dimensions")}</span>
          <input {...register("dimensions")} className={inputClassName} />
          {errors.dimensions && <p className={errorClassName}>{errors.dimensions.message}</p>}
        </label>

        <label className="space-y-1">
          <span className={labelClassName}>{t("common.dimensionsArabic")}</span>
          <input dir="rtl" {...register("dimensionsAr")} className={inputClassName} />
        </label>

        <label className="space-y-1">
          <span className={labelClassName}>{t("common.price")}</span>
          <input
            type="number"
            step="0.01"
            {...register("price")}
            className={inputClassName}
          />
          {errors.price && <p className={errorClassName}>{errors.price.message}</p>}
        </label>
      </div>

      <label className="block space-y-1">
        <span className={labelClassName}>{t("common.story")}</span>
        <textarea
          {...register("story")}
          className={`${inputClassName} h-24 py-3`}
        />
        {errors.story && <p className={errorClassName}>{errors.story.message}</p>}
      </label>

      <label className="block space-y-1">
        <span className={labelClassName}>{t("common.storyArabic")}</span>
        <textarea
          dir="rtl"
          {...register("storyAr")}
          className={`${inputClassName} h-24 py-3`}
        />
        {errors.storyAr && <p className={errorClassName}>{errors.storyAr.message}</p>}
      </label>

      <label className="block space-y-1">
        <span className={labelClassName}>{t("common.notes")}</span>
        <textarea
          {...register("notes")}
          className={`${inputClassName} h-24 py-3`}
        />
      </label>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-11 px-4 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? t("common.saving") : t("common.save")}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/admin/pieces/${pieceId}`)}
          className="h-11 px-4 border border-[#EAE7E4] rounded-lg text-[14px]"
        >
          {t("common.cancel")}
        </button>
      </div>
    </form>
  );
}
