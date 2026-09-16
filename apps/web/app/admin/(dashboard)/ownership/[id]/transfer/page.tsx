import { fetchAdminOwnershipDetail } from "@/features/admin/api/fetch-admin-ownership";
import { OperationReviewActions } from "@/features/admin/components/operations/components/operation-review-actions";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ApiError } from "@/shared/lib/send-request";
import { formatAdminDate } from "@/shared/utils/format";
import { ArrowLeft, ArrowRightLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

export default async function OwnershipTransferPage({
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

  let record;
  try {
    record = await fetchAdminOwnershipDetail(id, cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const transfer = record.activeTransfer;

  return (
    <>
      <div className="flex gap-[16px] px-7.5 py-3 [&>div]:rounded-xl [&>div]:h-15.5 [&>div]:bg-white">
        <div className="flex items-center justify-center w-15.5">
          <Link href={`/admin/ownership/${id}`}>
            <ArrowLeft className="size-6 rtl:rotate-180" />
          </Link>
        </div>
        <div className="w-full px-7.5 flex items-center justify-between">
          <h4 className="font-bold text-h6 text-neutral-800">
            {t("nav.ownership")} / {record.name} / Transfer
          </h4>
          <div className="flex items-center gap-2">
            <Image
              src="/admin/solar_home-2-line-duotone.svg"
              alt=""
              width={20}
              height={20}
            />
            <span>/</span>
            <span className="text-[14px] text-[#BF7266] bg-[#FBF7F7] py-1 px-2 rounded-lg">
              {t("common.access")}
            </span>
          </div>
        </div>
      </div>

      <div className="px-7.5 py-[16px]">
        <div className="p-6 bg-white rounded-3xl">
          <h1 className="font-heading border-b border-[#E1E4E8] pt-[16px] pb-[32px] text-[32px] font-bold text-[#212630] leading-[100%]">
            Transfer — {record.name}
          </h1>

          {transfer ? (
            <div className="pt-5">
              <div className="grid grid-cols-2 gap-x-[32px] gap-y-3 pb-[32px] border-b border-[#E1E4E8]">
                <ReadField label="Current Owner" value={transfer.fromClient.displayName} />
                <ReadField label="Recipient" value={transfer.toClient.displayName} />
                <ReadField label="Transfer Type" value={transfer.transferType} />
                <ReadField
                  label="Requested"
                  value={formatAdminDate(transfer.initiatedAt, locale)}
                />
                <div className="col-span-2">
                  <ReadField label={t("common.status")} value={transfer.status} />
                </div>
              </div>

              <OperationReviewActions
                kind="transfer"
                id={transfer.id}
                canReview={
                  !["APPROVED", "REJECTED", "CANCELLED"].includes(transfer.status)
                }
                approveLabel="Approve Transfer"
              />
            </div>
          ) : (
            <div className="pt-[32px] flex flex-col items-center gap-6 text-center">
              <ArrowRightLeft className="size-12 text-[#E1E4E8]" />
              <p className="text-[#5D697A] text-h6">
                No active transfer request for this piece.
              </p>
              <Link
                href="/admin/operations"
                className="h-11 px-6 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white flex items-center"
              >
                View All Operations
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[#272D35] text-h6 font-medium">{label}</span>
      <input
        type="text"
        readOnly
        value={value}
        className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
      />
    </div>
  );
}
