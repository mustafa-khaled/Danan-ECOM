import { MoveRight } from "lucide-react";
import Link from "next/link";
import type { AdminOverview } from "@/features/admin/api/fetch-admin-overview";
import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { pickLocalized } from "@/shared/lib/pick-localized";

export default async function CollectionsOverview({
  collections,
}: {
  collections: AdminOverview["collections"];
}) {
  const t = await getTranslations("admin");
  const locale = (await getLocale()) as Locale;

  return (
    <div className="p-6 h-86.75 rounded-2xl border-2 text-[#29343D] border-[#F3F3F3]">
      <h3 className="font-bold text-h5">{t("overview.collectionsOverview")}</h3>

      <div className="grid grid-cols-2 gap-6 mt-6 [&>div:nth-last-child(-n+2)]:border-none">
        {collections.map((item) => {
          return (
            <div
              key={item.id}
              className="h-29.5 border-b border-[#F3F3F3] pb-3"
            >
              <h6 className="font-bold text-h6 leading-[100%]">
                {pickLocalized(locale, item.name, item.nameAr)}
              </h6>

              <div className="mt-2 mb-3 text-h6 font-medium text-neutral-600">
                <p>{t("overview.pieceCount", { count: item.pieceCount })}</p>
                <p>{t("overview.ownerCount", { count: item.ownerCount })}</p>
              </div>

              <Link
                href={`/admin/collections/${item.id}`}
                className="flex items-center justify-between"
              >
                <span className="font-bold text-[12px]">{t("overview.viewCollection")}</span>
                <MoveRight className="size-[16px] rtl:rotate-180" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
