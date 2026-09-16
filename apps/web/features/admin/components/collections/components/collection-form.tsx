"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui";
import { useConfirm } from "@/components/confirm-dialog";
import type { AdminClass, AdminCollectionDetail } from "@/features/admin/types";
import {
  createCollection,
  updateCollection,
  deleteCollection,
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

interface CollectionFormProps {
  collection?: AdminCollectionDetail | null;
  mode: "create" | "edit";
}

const inputClassName = "w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none";
const labelClassName = "mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--color-ivory-muted)]";
const errorClassName = "mt-1 text-xs text-red-500";

export default function CollectionForm({ collection, mode }: CollectionFormProps) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const confirm = useConfirm();
  const [isDeleting, setIsDeleting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [classes, setClasses] = useState<AdminClass[]>([]);

  useEffect(() => {
    fetchAdminClasses()
      .then(setClasses)
      .catch(() => setClasses([]));
  }, []);

  const defaultValues: CollectionFormValues = {
    name: collection?.name ?? "",
    nameAr: collection?.nameAr ?? "",
    slug: collection?.slug ?? "",
    description: collection?.description ?? "",
    descriptionAr: collection?.descriptionAr ?? "",
    isVisible: collection?.isVisible ?? true,
    sortOrder: collection?.sortOrder ?? 0,
    classIds: collection?.classes?.map((cls) => cls.id) ?? [],
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CollectionFormValues>({
    resolver: zodResolver(
      mode === "create" ? createCollectionSchema : updateCollectionSchema,
    ) as Resolver<CollectionFormValues>,
    defaultValues,
  });

  const onSubmit = async (data: CollectionFormValues) => {
    setApiError(null);

    try {
      const payload = {
        ...data,
        description: data.description || undefined,
        descriptionAr: data.descriptionAr || undefined,
        classIds: data.classIds ?? [],
      };

      if (mode === "create") {
        await createCollection(payload);
      } else {
        await updateCollection(collection!.id, payload);
      }

      router.push("/admin/collections");
      router.refresh();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : `Failed to ${mode} collection`);
    }
  };

  const handleDelete = async () => {
    if (!collection) return;

    const confirmed = await confirm({
      title: "Delete Collection",
      message: "Are you sure you want to delete this collection? This cannot be undone.",
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
      setApiError(err instanceof Error ? err.message : "Failed to delete collection");
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
            <label htmlFor="col-name" className={labelClassName}>{t("common.nameEnglish")}</label>
            <input
              id="col-name"
              type="text"
              {...register("name")}
              className={inputClassName}
            />
            {errors.name && <p className={errorClassName}>{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="col-nameAr" className={labelClassName}>{t("common.nameArabic")}</label>
            <input
              id="col-nameAr"
              type="text"
              {...register("nameAr")}
              dir="rtl"
              className={inputClassName}
            />
            {errors.nameAr && <p className={errorClassName}>{errors.nameAr.message}</p>}
          </div>

          <div>
            <label htmlFor="col-slug" className={labelClassName}>{t("common.slug")}</label>
            <input
              id="col-slug"
              type="text"
              {...register("slug")}
              className={inputClassName}
            />
            {errors.slug && <p className={errorClassName}>{errors.slug.message}</p>}
            <p className="mt-1 text-xs text-[var(--color-ivory-muted)]">
              {t("collections.slugHint")}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="col-description" className={labelClassName}>{t("common.descriptionEnglish")}</label>
            <textarea
              id="col-description"
              {...register("description")}
              rows={3}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="col-descriptionAr" className={labelClassName}>{t("common.descriptionArabic")}</label>
            <textarea
              id="col-descriptionAr"
              {...register("descriptionAr")}
              rows={3}
              dir="rtl"
              className={inputClassName}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div>
          <label htmlFor="col-sortOrder" className={labelClassName}>Sort Order</label>
          <input
            id="col-sortOrder"
            type="number"
            {...register("sortOrder")}
            className={inputClassName}
          />
        </div>

        <div className="lg:col-span-2">
          <p className={labelClassName}>{t("collections.visibleToClasses")}</p>
          <div className="mt-2 flex flex-wrap gap-4">
            {classes.map((cls) => (
              <label key={cls.id} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  value={cls.id}
                  {...register("classIds")}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                {pickLocalized(locale, cls.name, cls.nameAr)}
                {cls.isDefault ? ` ${t("common.default")}` : ""}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-[var(--color-ivory-muted)]">
            {t("collections.emptyAssignment")}
          </p>
        </div>

        <div className="flex items-end">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              {...register("isVisible")}
              className="h-5 w-5 rounded border-[var(--color-border)] bg-[var(--color-surface)] accent-[var(--color-accent)]"
            />
            <span className="text-sm">{t("collections.isVisible")}</span>
          </label>
        </div>
      </div>

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
