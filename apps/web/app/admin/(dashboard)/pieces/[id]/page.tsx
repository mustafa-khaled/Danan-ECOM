import { fetchAdminPieceDetail } from "@/features/admin/api/fetch-admin-pieces";
import type { AdminPieceDetail } from "@/features/admin/types";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ApiError } from "@/shared/lib/send-request";
import { pickLocalized } from "@/shared/lib/pick-localized";
import { formatAdminDate } from "@/shared/utils/format";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

function collectionName(collection: AdminPieceDetail["collection"], locale: Locale): string {
  return pickLocalized(locale, collection?.name ?? "", collection?.nameAr) ?? "";
}

function ownerName(owner: unknown): string {
  if (!owner) return "";
  if (typeof owner === "string") return owner;
  if (typeof owner === "object" && "displayName" in owner) {
    return String((owner as { displayName?: string }).displayName ?? "");
  }
  return "";
}

export default async function AdminPieceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieHeader = await getAdminCookieHeader();
  const [t, locale] = await Promise.all([
    getTranslations("admin"),
    getLocale() as Promise<Locale>,
  ]);

  let piece: AdminPieceDetail;
  try {
    piece = (await fetchAdminPieceDetail(id, cookieHeader)) as AdminPieceDetail;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const name = pickLocalized(locale, piece.name, piece.nameAr);
  const story = pickLocalized(locale, piece.story ?? "", piece.storyAr);
  const material = pickLocalized(locale, piece.material ?? "", piece.materialAr);
  const dimensions = pickLocalized(locale, piece.dimensions ?? "", piece.dimensionsAr);

  return (
    <>
      <div className="flex gap-[16px] px-7.5 py-3 [&>div]:rounded-xl [&>div]:h-15.5 [&>div]:bg-white">
        <div className="flex items-center justify-center w-15.5">
          <Link href="/admin/pieces">
            <ArrowLeft className="size-6 rtl:rotate-180" />
          </Link>
        </div>
        <div className="w-full px-7.5 flex items-center justify-between">
          <h4 className="font-bold text-h6 text-neutral-800">{t("topbar.pieceDetails")}</h4>
          <div className="flex items-center gap-2">
            <Image
              src="/admin/solar_home-2-line-duotone.svg"
              alt=""
              width={20}
              height={20}
            />
            <span>/</span>
            <span className="text-[14px] text-[#BF7266] bg-[#FBF7F7] py-1 px-2 rounded-lg transition-all">
              {t("common.access")}
            </span>
          </div>
        </div>
      </div>

      <div className="px-7.5 py-[16px]">
        <div className="p-6 bg-white rounded-3xl">
          <h1 className="font-heading border-b border-[#E1E4E8] pt-[16px] pb-[32px] text-[32px] font-bold text-[#212630] leading-[100%]">
            {name}
          </h1>

          <div className="pt-5 pb-[32px] border-b border-[#E1E4E8]">
            <h4 className="font-heading mb-5 text-h4 font-bold">{t("pieces.overview")}</h4>
            <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
              <ReadField label={t("common.serial")} value={piece.serialNumber} />
              <ReadField label={t("common.collection")} value={collectionName(piece.collection, locale)} />
              <ReadField label={t("common.status")} value={piece.status} />
              <ReadField label={t("pieces.currentOwner")} value={ownerName(piece.currentOwner)} />
              <ReadField
                label={t("common.updated")}
                value={formatAdminDate(piece.updatedAt, locale)}
              />
              <ReadField label={t("common.notes")} value={piece.notes ?? ""} />
            </div>
            {(story || material || dimensions) && (
              <div className="grid grid-cols-2 gap-x-[32px] gap-y-3 mt-3">
                {story && <ReadField label={t("common.story")} value={story} />}
                {material && <ReadField label={t("common.material")} value={material} />}
                {dimensions && <ReadField label={t("common.dimensions")} value={dimensions} />}
              </div>
            )}
            {piece.specifications && piece.specifications.length > 0 && (
              <div className="mt-3">
                <h5 className="font-heading text-h5 font-bold mb-3">{t("pieces.specifications")}</h5>
                <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
                  {piece.specifications.map((spec) => (
                    <ReadField
                      key={spec.key}
                      label={pickLocalized(locale, spec.key, spec.keyAr)}
                      value={pickLocalized(locale, spec.value, spec.valueAr)}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-end gap-3 w-full mt-[16px]">
              <Link
                href={`/admin/pieces/${id}/edit`}
                className="w-24 h-11 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white flex items-center justify-center"
              >
                {t("common.edit")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[#272D35] text-h6 font-medium">{label}</label>
      <input
        type="text"
        readOnly
        value={value}
        className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
      />
    </div>
  );
}
