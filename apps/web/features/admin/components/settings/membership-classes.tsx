"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  createClass,
  deleteClass,
  fetchAdminClasses,
  updateClass,
} from "@/features/admin/api/fetch-admin-classes";
import type { AdminClass } from "@/features/admin/types";
import { pickLocalized } from "@/shared/lib/pick-localized";
import { adminKeys } from "@/shared/lib/query-keys";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";

export default function MembershipClasses() {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const classesQuery = useQuery({
    queryKey: adminKeys.classes(),
    queryFn: () => fetchAdminClasses(),
    retry: false,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: adminKeys.classes() });

  const create = useMutation({
    mutationFn: () =>
      createClass({
        name: name.trim(),
        nameAr: nameAr.trim() || undefined,
        slug: slug.trim(),
        description: description.trim() || undefined,
      }),
    onSuccess: async () => {
      setName("");
      setNameAr("");
      setSlug("");
      setDescription("");
      setError(null);
      await invalidate();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : t("settings.failedCreate")),
  });

  const setDefault = useMutation({
    mutationFn: (cls: AdminClass) => updateClass(cls.id, { isDefault: true }),
    onSuccess: async () => {
      setError(null);
      await invalidate();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : t("settings.failedDefault")),
  });

  const hide = useMutation({
    mutationFn: (cls: AdminClass) => deleteClass(cls.id),
    onSuccess: async () => {
      setError(null);
      await invalidate();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : t("settings.failedHide")),
  });

  const classes = classesQuery.data ?? [];
  const loadError = classesQuery.error
    ? classesQuery.error instanceof Error
      ? classesQuery.error.message
      : t("settings.failedLoad")
    : null;
  const message = error ?? loadError;

  const handleCreate = () => {
    if (!name.trim() || !slug.trim()) return;
    create.mutate();
  };

  return (
    <section>
      <Accordion type="single" collapsible>
        <AccordionItem value="house">
          <AccordionTrigger className="py-[16px] px-6 border-b border-[#E1E4E8]">
            <div className="text-[#29343D]">
              <h2 className="font-bold text-h5 leading-[100%]">
                {t("settings.membershipClasses")}
              </h2>
              <p className="text-[12px] font-semibold mt-3">
                {t("settings.membershipHint")}
              </p>
            </div>
          </AccordionTrigger>

          <AccordionContent className="p-6">
            {message && <p className="mb-4 text-sm text-red-500">{message}</p>}

            <div className="grid grid-cols-2 gap-x-[16px] gap-y-5">
              {classes.map((cls) => (
                <div key={cls.id} className="p-[16px] bg-[#FBF7F7]">
                  <h4 className="font-bold text-h4 text-[#272D35] leading-[100%]">
                    {pickLocalized(locale, cls.name, cls.nameAr)}
                    {!cls.isActive ? ` ${t("common.hidden")}` : ""}
                  </h4>
                  <h5 className="text-body-lg font-semibold text-[#353D48] mt-3 mb-[16px]">
                    {cls.description || cls.slug}
                    {cls.isDefault ? ` ${t("settings.defaultForNew")}` : ""}
                  </h5>
                  <h6 className="text-h6 font-medium text-[#4B5563] uppercase">
                    {t("settings.classMeta", { members: cls.clientCount ?? 0, collections: cls.collectionCount ?? 0 })}
                  </h6>
                  <div className="mt-[16px] flex gap-3 text-[#BF7266] font-semibold text-sm">
                    {!cls.isDefault && cls.isActive && (
                      <button
                        type="button"
                        disabled={setDefault.isPending}
                        onClick={() => setDefault.mutate(cls)}
                      >
                        {t("settings.makeDefault")}
                      </button>
                    )}
                    {cls.isActive && (
                      <button
                        type="button"
                        disabled={hide.isPending}
                        onClick={() => hide.mutate(cls)}
                      >
                        {t("settings.hide")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("settings.className")}
                className="border-none bg-[#F8FAFC] h-12 px-4"
              />
              <input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder={t("settings.classNameAr")}
                dir="rtl"
                className="border-none bg-[#F8FAFC] h-12 px-4"
              />
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={t("settings.slugPlaceholder")}
                className="border-none bg-[#F8FAFC] h-12 px-4"
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="border-none bg-[#F8FAFC] h-12 px-4 sm:col-span-3"
              />
              <button
                type="button"
                disabled={create.isPending}
                onClick={handleCreate}
                className="h-11 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white sm:col-span-3"
              >
                {create.isPending
                  ? t("common.creating")
                  : t("settings.createClass")}
              </button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
