import { fetchAdminOperationDetail } from "@/features/admin/api/fetch-admin-operations";
import { fetchAdminPieceDetail } from "@/features/admin/api/fetch-admin-pieces";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ApiError } from "@/shared/lib/send-request";
import { formatAdminDate } from "@/shared/utils/format";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

export default async function OperationCertificatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kind?: "transfer" | "staff" }>;
}) {
  const { id } = await params;
  const { kind } = await searchParams;
  const cookieHeader = await getAdminCookieHeader();
  const [t, locale] = await Promise.all([
    getTranslations("admin"),
    getLocale() as Promise<Locale>,
  ]);

  let operation: Record<string, unknown>;
  try {
    operation = await fetchAdminOperationDetail(id, kind, cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const piece =
    operation.piece && typeof operation.piece === "object"
      ? (operation.piece as { id?: string; name?: string; serialNumber?: string })
      : null;

  let certificateNumber = "";
  let issuedAt = "";
  let ownerName = "";
  if (piece?.id) {
    try {
      const detail = (await fetchAdminPieceDetail(
        piece.id,
        cookieHeader,
      )) as unknown as {
        certificates?: Array<{
          certificateNumber?: string;
          issuedAt?: string;
          isActive?: boolean;
        }>;
        currentOwner?: { displayName?: string } | null;
      };
      const active = detail.certificates?.find((cert) => cert.isActive);
      certificateNumber = active?.certificateNumber ?? "";
      issuedAt = formatAdminDate(active?.issuedAt, locale);
      ownerName = detail.currentOwner?.displayName ?? "";
    } catch {
      certificateNumber = "";
    }
  }

  return (
    <>
      <div className="flex gap-[16px] px-7.5 py-3 [&>div]:rounded-xl [&>div]:h-15.5 [&>div]:bg-white">
        <div className="flex items-center justify-center w-15.5">
          <Link href={`/admin/operations/${id}${kind ? `?kind=${kind}` : ""}`}>
            <ArrowLeft className="size-6 rtl:rotate-180" />
          </Link>
        </div>
        <div className="w-full px-7.5 flex items-center justify-between">
          <h4 className="font-bold text-h6 text-neutral-800">
            {t("topbar.operationCertificate")}
          </h4>
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
            {piece?.name || text(operation.type) || "Certificate"}
          </h1>
          <div className="pt-5 grid grid-cols-2 gap-x-[32px] gap-y-3">
            <ReadField label={t("common.serial")} value={piece?.serialNumber ?? ""} />
            <ReadField label="Certificate number" value={certificateNumber} />
            <ReadField label={t("common.since")} value={issuedAt} />
            <ReadField label={t("common.owner")} value={ownerName} />
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
