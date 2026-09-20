"use client";

// manage data effecently using react hook form and zod schema
// replace useState with proficnal state manger use reducer for example

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useForm,
  useController,
  useWatch,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui";
import { useConfirm } from "@/components/confirm-dialog";
import type { AdminClass, AdminCollectionDetail } from "@/features/admin/types";
import {
  createCollection,
  updateCollection,
  deleteCollection,
  uploadCollectionCover,
} from "@/features/admin/api/fetch-admin-collections";
import { fetchAdminClasses } from "@/features/admin/api/fetch-admin-classes";
import {
  createCollectionSchema,
  updateCollectionSchema,
  type CollectionFormValues,
} from "@/features/admin/schemas";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { pickLocalized } from "@/shared/lib/pick-localized";
import Image from "next/image";
import { Upload, X } from "lucide-react";

interface CollectionFormProps {
  collection?: AdminCollectionDetail | null;
  mode: "create" | "edit";
}

const labelClassName =
  "mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--color-ivory-muted)]";
const errorClassName = "mt-1 text-xs text-red-500";

/** Converts a string into a URL-safe slug: lowercase, spaces → hyphens, strips non-alphanumeric. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function CollectionForm({
  collection,
  mode,
}: CollectionFormProps) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const confirm = useConfirm();

  const [isDeleting, setIsDeleting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);

  // Cover image state
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);

  useEffect(() => {
    setClassesLoading(true);
    fetchAdminClasses()
      .then(setClasses)
      .catch(() => setClasses([]))
      .finally(() => setClassesLoading(false));
  }, []);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CollectionFormValues>({
    resolver: zodResolver(
      mode === "create" ? createCollectionSchema : updateCollectionSchema,
    ) as Resolver<CollectionFormValues>,
    defaultValues: {
      name: collection?.name ?? "",
      nameAr: collection?.nameAr ?? "",
      slug: collection?.slug ?? "",
      description: collection?.description ?? "",
      descriptionAr: collection?.descriptionAr ?? "",
      // isVisible defaults to false for new collections; existing collections preserve their value
      isVisible: collection?.isVisible ?? false,
      sortOrder: collection?.sortOrder ?? 0,
      classIds: collection?.classes?.map((cls) => cls.id) ?? [],
    },
  });

  // ── Auto-slug from English name ──────────────────────────────────────────
  // Track whether admin has manually edited the slug field
  const [slugTouched, setSlugTouched] = useState(Boolean(collection?.slug));
  const watchedName = useWatch({ control, name: "name" });

  useEffect(() => {
    if (!slugTouched && watchedName) {
      setValue("slug", slugify(watchedName), { shouldValidate: false });
    }
  }, [watchedName, slugTouched, setValue]);

  // ── isVisible auto-derived from classIds selection ────────────────────────
  const { field: classIdsField } = useController({
    name: "classIds",
    control,
  });

  const selectedClassIds: string[] = classIdsField.value ?? [];

  useEffect(() => {
    // Automatically make visible when at least one class is assigned
    const ids: string[] = classIdsField.value ?? [];
    setValue("isVisible", ids.length > 0, { shouldValidate: false });
  }, [classIdsField.value, setValue]);

  // ── Cover file selection ─────────────────────────────────────────────────
  const onCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setCoverError(null);
  };

  const clearCoverSelection = () => {
    setCoverFile(null);
    setCoverPreview(null);
    setCoverError(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  // ── Upload cover immediately (edit mode only) ────────────────────────────
  const handleCoverUpload = async () => {
    if (!coverFile || !collection) return;
    setCoverUploading(true);
    setCoverError(null);
    try {
      await uploadCollectionCover(collection.id, coverFile);
      clearCoverSelection();
      router.refresh();
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : "Cover upload failed");
    } finally {
      setCoverUploading(false);
    }
  };

  // ── Form submit ──────────────────────────────────────────────────────────
  const onSubmit = async (data: CollectionFormValues) => {
    setApiError(null);
    setCoverError(null);

    try {
      const payload = {
        ...data,
        description: data.description || undefined,
        descriptionAr: data.descriptionAr || undefined,
        classIds: data.classIds ?? [],
      };

      if (mode === "create") {
        const created = await createCollection(payload);

        // Upload cover after creation if one was selected; redirect either way
        if (coverFile) {
          try {
            await uploadCollectionCover(created.id, coverFile);
          } catch (err) {
            // Collection was created successfully; surface the cover error but still navigate
            setCoverError(
              err instanceof Error
                ? `Collection created, but cover upload failed: ${err.message}`
                : "Collection created, but cover upload failed.",
            );
          }
        }
      } else {
        await updateCollection(collection!.id, payload);
      }

      router.push("/admin/collections");
      router.refresh();
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : `Failed to ${mode} collection`,
      );
    }
  };

  const handleDelete = async () => {
    if (!collection) return;

    const confirmed = await confirm({
      title: "Delete Collection",
      message:
        "Are you sure you want to delete this collection? This cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!confirmed) return;

    setIsDeleting(true);
    setApiError(null);

    try {
      await deleteCollection(collection.id);
      router.push("/admin/collections");
      router.refresh();
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Failed to delete collection",
      );
      setIsDeleting(false);
    }
  };

  // ── Toggle a single classId in the controlled array ──────────────────────
  const toggleClass = (id: string) => {
    const current: string[] = classIdsField.value ?? [];
    const next = current.includes(id)
      ? current.filter((v: string) => v !== id)
      : [...current, id];
    classIdsField.onChange(next);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* API error */}
      {apiError && (
        <div className="rounded-(--radius-panel) border border-red-500/40 bg-red-500/10 p-4">
          <p className="text-red-500">{apiError}</p>
        </div>
      )}

      {/* Cover upload error (non-blocking) */}
      {coverError && (
        <div className="rounded-(--radius-panel) border border-amber-500/40 bg-amber-500/10 p-4 flex items-start justify-between gap-3">
          <p className="text-amber-700 text-sm">{coverError}</p>
          <button
            type="button"
            onClick={() => setCoverError(null)}
            className="shrink-0 text-amber-600 hover:text-amber-800"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <h2 className="font-heading text-h4 uppercase font-bold">
        Collection Information
      </h2>

      <div className="grid grid-cols-5 gap-6">
        {/* English name */}
        <div className="flex flex-col gap-2 col-span-2">
          <label
            htmlFor="col-name"
            className="text-[#272D35] text-h6 font-medium"
          >
            {t("common.nameEnglish")}
          </label>
          <input
            id="col-name"
            type="text"
            {...register("name")}
            className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
          />
          {errors.name && (
            <p className={errorClassName}>{errors.name.message}</p>
          )}
        </div>

        {/* Arabic name — id fixed from "col-name" → "col-nameAr" */}
        <div className="flex flex-col gap-2 col-span-2">
          <label
            htmlFor="col-nameAr"
            className="text-[#272D35] text-h6 font-medium"
          >
            {t("common.nameArabic")}
          </label>
          <input
            id="col-nameAr"
            type="text"
            {...register("nameAr")}
            dir="rtl"
            className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
          />
          {errors.nameAr && (
            <p className={errorClassName}>{errors.nameAr.message}</p>
          )}
        </div>

        {/* Slug — auto-populated, manual override tracked */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="col-slug"
            className="text-[#272D35] text-h6 font-medium"
          >
            {t("common.slug")}
          </label>
          <input
            id="col-slug"
            type="text"
            {...register("slug")}
            onFocus={() => setSlugTouched(true)}
            className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
          />
          {errors.slug && (
            <p className={errorClassName}>{errors.slug.message}</p>
          )}
        </div>
      </div>

      {/* Descriptions */}
      <div className="grid grid-cols-2 gap-6 pb-6 border-b border-[#E1E4E8]">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="col-description"
            className="text-[#272D35] text-h6 font-medium"
          >
            {t("common.descriptionEnglish")}
          </label>
          <textarea
            id="col-description"
            {...register("description")}
            rows={3}
            className="border-none bg-[#F8FAFC] h-25.75 p-[16px] resize-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="col-descriptionAr"
            className="text-[#272D35] text-h6 font-medium"
          >
            {t("common.descriptionArabic")}
          </label>
          <textarea
            id="col-descriptionAr"
            {...register("descriptionAr")}
            rows={3}
            dir="rtl"
            className="border-none bg-[#F8FAFC] h-25.75 p-[16px] resize-none"
          />
        </div>
      </div>

      {/* Cover image */}
      <div>
        <p className="font-heading text-[#272D35] text-h4 font-bold mb-3">
          Collection Cover <span className="text-red-500">*</span>
        </p>

        <div className="bg-[#F8FAFC] p-6 flex flex-col items-center justify-center gap-4 min-h-50">
          {/* Show existing cover in edit mode when no new file is staged */}
          {collection?.coverImageUrl && !coverPreview && (
            <div className="relative h-40 w-40 rounded-lg overflow-hidden border border-[#E1E4E8]">
              <Image
                src={collection.coverImageUrl}
                alt="Current collection cover"
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Preview of newly selected file */}
          {coverPreview && (
            <div className="relative inline-block">
              <div className="relative h-40 w-40 rounded-lg overflow-hidden border border-[#E1E4E8]">
                <Image
                  src={coverPreview}
                  alt="Cover preview"
                  fill
                  className="object-cover"
                />
              </div>
              <button
                type="button"
                onClick={clearCoverSelection}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center"
                aria-label="Remove cover selection"
              >
                <X className="size-3" />
              </button>
            </div>
          )}

          {/* No cover at all */}
          {!collection?.coverImageUrl && !coverPreview && (
            <Image
              alt="Upload placeholder"
              src="/admin/upload-images.svg"
              width={100}
              height={100}
            />
          )}

          {/* File picker + upload button */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={coverInputRef}
              id="col-cover-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={onCoverFileChange}
              className="hidden"
            />
            <label
              htmlFor="col-cover-input"
              className="h-10 px-4 border border-[#E1E4E8] rounded-lg text-sm font-medium text-[#141210] flex items-center gap-2 cursor-pointer hover:bg-white transition-colors"
            >
              <Upload className="size-4" />
              {coverFile ? coverFile.name : "Choose image"}
            </label>

            {/* In edit mode: upload immediately */}
            {mode === "edit" && coverFile && (
              <button
                type="button"
                disabled={coverUploading}
                onClick={handleCoverUpload}
                className="h-10 px-4 bg-[#BF7266] rounded-lg text-sm font-medium text-white disabled:opacity-60"
              >
                {coverUploading ? "Uploading…" : "Upload Cover"}
              </button>
            )}

            {/* In create mode: show a note that it'll upload after creation */}
            {mode === "create" && coverFile && (
              <span className="text-xs text-(--color-ivory-muted)">
                Will upload after collection is created.
              </span>
            )}
          </div>

          {coverError && mode === "edit" && (
            <p className="text-sm text-red-500">{coverError}</p>
          )}
        </div>
      </div>

      {/* Class visibility assignments */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className={labelClassName}>{t("collections.visibleToClasses")}</p>

          {classesLoading ? (
            /* Loading skeleton */
            <div className="mt-2 flex flex-wrap gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-24 rounded-full bg-[#E1E4E8] animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap gap-4">
              {classes.map((cls) => {
                const isChecked = selectedClassIds.includes(cls.id);
                const inputId = `cls-${cls.id}`;
                return (
                  <label
                    key={cls.id}
                    htmlFor={inputId}
                    className="flex cursor-pointer items-center gap-2 text-sm select-none"
                  >
                    {/* Hidden native checkbox keeps accessibility + form semantics */}
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleClass(cls.id)}
                      className="sr-only peer"
                    />
                    {/* Custom checkbox box */}
                    <span
                      className={[
                        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                        isChecked
                          ? "bg-[#BF7266] border-[#BF7266]"
                          : "bg-white border-[#D1D5DB]",
                      ].join(" ")}
                      aria-hidden="true"
                    >
                      {isChecked && (
                        <svg
                          viewBox="0 0 10 8"
                          fill="none"
                          className="h-2.5 w-2.5"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1 4L3.5 6.5L9 1"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    {/* Label text — white when checked */}
                    <span
                      className={
                        isChecked
                          ? "text-[#BF7266] font-medium"
                          : "text-[#272D35]"
                      }
                    >
                      {pickLocalized(locale, cls.name, cls.nameAr)}
                      {cls.isDefault ? ` ${t("common.default")}` : ""}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {/* Hidden input to feed classIds into the RHF register pipeline */}
          <input
            type="hidden"
            {...classIdsField}
            value={selectedClassIds.join(",")}
          />

          <p className="mt-2 text-xs text-(--color-ivory-muted)">
            {t("collections.emptyAssignment")}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="submit" loading={isSubmitting} variant="primary">
          {mode === "create" ? "Create Collection" : "Save Changes"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/collections")}
        >
          {t("common.cancel")}
        </Button>

        {mode === "edit" && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            loading={isDeleting}
            className="ms-auto"
          >
            Delete Collection
          </Button>
        )}
      </div>
    </form>
  );
}
