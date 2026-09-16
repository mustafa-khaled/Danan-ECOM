"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerPiece } from "@/features/admin/api/fetch-admin-pieces";
import {
  registerPieceSchema,
  type RegisterPieceFormValues,
} from "@/features/admin/schemas";
import { useTranslations } from "next-intl";

interface RegisterPieceFormProps {
  collectionId: string;
}

const inputClassName =
  "w-full border-none bg-[#F8FAFC] h-12 px-4 text-[var(--color-text)]";
const labelClassName = "text-[#272D35] text-sm font-medium";
const errorClassName = "mt-1 text-xs text-red-500";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function RegisterPieceForm({ collectionId }: RegisterPieceFormProps) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const slugManuallyEdited = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterPieceFormValues>({
    resolver: zodResolver(registerPieceSchema),
    defaultValues: { weight: 1, price: 0 },
  });

  const { onChange: onNameChange, ...nameFieldProps } = register("name");
  const { onChange: onSlugChange, ...slugFieldProps } = register("slug");

  const onSubmit = async (data: RegisterPieceFormValues) => {
    setApiError(null);
    try {
      await registerPiece({
        collectionId,
        name: data.name,
        nameAr: data.nameAr,
        slug: data.slug,
        story: data.story,
        storyAr: data.storyAr,
        material: data.material,
        materialAr: data.materialAr,
        weight: Number(data.weight),
        dimensions: data.dimensions,
        dimensionsAr: data.dimensionsAr,
        price: Number(data.price),
      });
      reset();
      slugManuallyEdited.current = false;
      setOpen(false);
      router.refresh();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to register piece");
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-11 px-4 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white"
      >
        {t("pieces.register")}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-[#E1E4E8] p-6"
    >
      <h3 className="font-heading text-h5 font-bold">{t("pieces.registerTitle")}</h3>
      {apiError && <p className="text-sm text-red-500">{apiError}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className={labelClassName}>{t("common.nameEnglish")}</span>
          <input
            {...nameFieldProps}
            className={inputClassName}
            onChange={(e) => {
              void onNameChange(e);
              if (!slugManuallyEdited.current) {
                setValue("slug", slugify(e.target.value), { shouldValidate: false });
              }
            }}
          />
          {errors.name && <p className={errorClassName}>{errors.name.message}</p>}
        </label>

        <label className="space-y-1">
          <span className={labelClassName}>{t("common.nameArabic")}</span>
          <input
            dir="rtl"
            {...register("nameAr")}
            className={inputClassName}
          />
          {errors.nameAr && <p className={errorClassName}>{errors.nameAr.message}</p>}
        </label>

        <label className="space-y-1">
          <span className={labelClassName}>{t("common.slug")}</span>
          <input
            {...slugFieldProps}
            className={inputClassName}
            onChange={(e) => {
              slugManuallyEdited.current = e.target.value !== "";
              void onSlugChange(e);
            }}
          />
          {errors.slug && <p className={errorClassName}>{errors.slug.message}</p>}
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

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-11 px-4 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? t("common.saving") : t("pieces.create")}
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            slugManuallyEdited.current = false;
            setOpen(false);
          }}
          className="h-11 px-4 border border-[#EAE7E4] rounded-lg text-[14px]"
        >
          {t("common.cancel")}
        </button>
      </div>
    </form>
  );
}
