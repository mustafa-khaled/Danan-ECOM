"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoveDown, Plus } from "lucide-react";
import type { AdminCollectionDetail } from "@/features/admin/types";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { pickLocalized } from "@/shared/lib/pick-localized";

interface SingleCollectionHeroProps {
  collection: AdminCollectionDetail | null;
}

export default function SingleCollectionHero({
  collection,
}: SingleCollectionHeroProps) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const pathname = usePathname();

  const isAccess =
    pathname.endsWith("/access") || pathname.includes("/access/");
  const isSettings =
    pathname.endsWith("/settings") || pathname.includes("/settings/");

  type RouteKey = "access" | "settings";
  const routeKey: RouteKey | null = isAccess ? "access" : isSettings ? "settings" : null;

  const ROUTE_CONTENT: Record<RouteKey, { title: string; description: string; showActions: boolean }> = {
    access: {
      title: t("collections.accessTitle"),
      description: t("collections.accessDescription"),
      showActions: false,
    },
    settings: {
      title: t("collections.settingsTitle"),
      description: t("collections.settingsDescription"),
      showActions: false,
    },
  };

  const customContent = routeKey ? ROUTE_CONTENT[routeKey] : null;

  const collectionName = collection
    ? pickLocalized(locale, collection.name, collection.nameAr)
    : "";
  const collectionDescription = collection
    ? pickLocalized(locale, collection.description ?? "", collection.descriptionAr)
    : "";

  return (
    <>
      <div className="relative h-130.25 mt-6 mb-[40px] w-full">
        <Image
          src={collection?.coverImageUrl || ""}
          alt={collectionName || ""}
          fill
          className="rounded-xl object-cover"
        />
      </div>

      <div className="flex items-start justify-between font-bold">
        <div>
          <h2 className="font-heading mb-[16px] text-[32px] leading-[100%]">
            {customContent ? customContent.title : collectionName}
          </h2>
          <p className="text-[#4B5563] text-h5">
            {customContent ? (
              customContent.description
            ) : (
              <>
                {t("collections.inspiredBy")}
                <br />
                {collectionDescription}
              </>
            )}
          </p>
        </div>

        {(!customContent || customContent.showActions) && (
          <div className="flex gap-3 self-end">
            <button
              type="button"
              className="w-37.5 h-12.25 text-body-lg font-semibold flex items-center justify-center gap-[16px] px-3 text-warm-900 bg-warm-500 rounded-lg hover:opacity-90 transition-opacity"
            >
              {t("common.download")}
              <MoveDown className="size-5" />
            </button>
            <Link href="/admin/collections/new">
              <button
                type="button"
                className="w-58 h-12.25 text-body-lg font-semibold flex items-center justify-center gap-[16px] px-3 text-teal-900 bg-[#4CBEAE] rounded-lg hover:opacity-90 transition-opacity"
              >
                {t("collections.addNew")}
                <Plus className="size-5" />
              </button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
