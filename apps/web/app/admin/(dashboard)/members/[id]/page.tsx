import { PieceCard } from "@/components/ui";
import { MemberClassSelect, MemberOverviewForm } from "@/features/admin";
import { fetchAdminClientDetail } from "@/features/admin/api/fetch-admin-clients";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ApiError } from "@/shared/lib/send-request";
import { formatAdminDate } from "@/shared/utils/format";
import { pickLocalized } from "@/shared/lib/pick-localized";
import { ArrowLeft, MoveRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

interface MemberDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberDetailsPage({
  params,
}: MemberDetailsPageProps) {
  const { id } = await params;
  const cookieHeader = await getAdminCookieHeader();
  const [t, locale] = await Promise.all([
    getTranslations("admin"),
    getLocale() as Promise<Locale>,
  ]);
  let member;
  try {
    member = await fetchAdminClientDetail(id, cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const joined = formatAdminDate(member.createdAt, locale);
  const lastActive = formatAdminDate(member.lastSeenAt, locale);
  const ownedPieces = member.ownedPieces ?? [];

  return (
    <>
      <div className="flex gap-[16px] px-7.5 py-3 [&>div]:rounded-xl [&>div]:h-15.5 [&>div]:bg-white">
        <div className="flex items-center justify-center w-15.5">
          <Link href="/admin/members">
            <ArrowLeft className="size-6 rtl:rotate-180" />
          </Link>
        </div>
        <div className="w-full px-7.5 flex items-center justify-between">
          <h4 className="font-bold text-h6 text-neutral-800">{t("nav.members")}</h4>
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
            {t("members.details")}
          </h1>

          <div className="pt-5 pb-[32px] border-b border-[#E1E4E8]">
            <h4 className="font-heading mb-5 text-h4 font-bold">
              {t("members.overview")}
            </h4>

            <MemberOverviewForm
              memberId={id}
              houseId={member.houseId ?? member.id}
              email={member.email}
              joined={joined}
              lastActive={lastActive}
            />
          </div>

          <div className="pt-5 pb-[32px] border-b border-[#E1E4E8]">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-heading text-h4 font-bold">{t("members.ownedPieces")}</h4>
                <p className="text-h6 font-semibold text-[#4B5563]">
                  {t("members.ownedCount", { count: member.pieceCount })}
                </p>
              </div>

              <Link
                href="/admin/ownership"
                className="h-14 w-51.75 p-[16px] flex items-center justify-between font-medium text-h6 border border-[#E1E4E8]"
              >
                {t("common.viewAll")}
                <MoveRight className="size-6 rtl:rotate-180" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-[16px] mt-5">
              {ownedPieces.slice(0, 3).map((piece) => (
                <Link key={piece.id} href={`/admin/ownership/${piece.id}`}>
                  <PieceCard
                    piece={{
                      id: piece.id,
                      name: pickLocalized(locale, piece.name, piece.nameAr),
                      ownedSince: piece.serialNumber,
                      imageUrl: piece.mainImageUrl ?? "/assets/wardrobe.avif",
                    }}
                    className="lg:h-160! border-none"
                  />
                </Link>
              ))}
            </div>
          </div>

          <div className="py-[32px] border-b border-[#E1E4E8]">
            <h4 className="font-heading mb-5 text-h4 font-bold">
              {t("members.houseAccess")}
            </h4>
            <MemberClassSelect memberId={id} />
          </div>
        </div>
      </div>
    </>
  );
}
