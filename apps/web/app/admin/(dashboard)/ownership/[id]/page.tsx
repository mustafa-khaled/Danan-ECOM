import { fetchAdminOwnershipDetail } from "@/features/admin/api/fetch-admin-ownership";
import { OperationReviewActions } from "@/features/admin/components/operations/components/operation-review-actions";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ApiError } from "@/shared/lib/send-request";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function OwnershipDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieHeader = await getAdminCookieHeader();
  let record;
  try {
    record = await fetchAdminOwnershipDetail(id, cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
  const currentOwnership =
    record.ownershipRecords.find((item) => !item.transferredAt) ??
    record.ownershipRecords.at(-1);
  const transfer = record.activeTransfer;

  return (
    <>
      <div className="flex gap-[16px] px-7.5 py-3 [&>div]:rounded-xl [&>div]:h-15.5 [&>div]:bg-white">
        <div className="flex items-center justify-center w-15.5">
          <Link href="/admin/ownership">
            <ArrowLeft className="size-6" />
          </Link>
        </div>
        <div className="w-full px-7.5 flex items-center justify-between">
          <h4 className="font-bold text-h6 text-neutral-800">
            Ownership Details
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
              Access
            </span>
          </div>
        </div>
      </div>

      <div className="px-7.5 py-[16px]">
        <div className="p-6 bg-white rounded-3xl">
          <h1 className="font-heading border-b border-[#E1E4E8] pt-[16px] pb-[32px] text-[32px] font-bold text-[#212630] leading-[100%]">
            Ownership/{record.name}
          </h1>

          <div className="pt-5 pb-[32px] border-b border-[#E1E4E8]">
            <h4 className="font-heading mb-5 text-h4 font-bold">
              Member Overview
            </h4>

            <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
              <ReadField label="Mawaddah Ring" value={record.name} />
              <ReadField
                label="Current Owner"
                value={record.currentOwner?.displayName ?? ""}
              />
              <ReadField label="Ownership Status" value={record.status} />
              <ReadField label="Acquired" value={formatDate(currentOwnership?.acquiredAt)} />
            </div>
          </div>

          <div className="pt-[32px]">
            <h4 className="font-heading text-h4 font-bold">
              Ownership Timeline
            </h4>

            <div className="pb-[32px] pt-6 border-b border-[#E1E4E8]">
              {record.ownershipRecords.length === 0 ? (
                <p className="text-[#353D48] text-h6">No ownership history yet.</p>
              ) : (
                record.ownershipRecords.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-[32px] font-semibold ${
                      index === 0 ? "pb-5 border-b border-[#E1E4E8]" : "pt-5"
                    }`}
                  >
                    <h6 className="font-heading text-h4">{formatDate(item.acquiredAt)}</h6>
                    <p className="text-[#353D48] text-h6">
                      {item.client.displayName}
                      <br />
                      {item.transferredAt ? "Transferred Piece" : "Acquired Piece"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {transfer && (
            <div className="pt-[32px]">
              <h4 className="font-heading text-h4 font-bold mb-6">
                Transfer Details
              </h4>

              <div className="space-y-5 text-[#353D48] text-h6 [&>p]:border-[#E1E4E8] [&>p]:border-b [&>p]:pb-6 [&>p:last-child]:border-none">
                <p>
                  Current Owner
                  <br />
                  {transfer.fromClient.displayName}
                </p>
                <p>
                  Recipient
                  <br />
                  {transfer.toClient.displayName}
                </p>
                <p>
                  Transfer Type
                  <br />
                  {transfer.transferType}
                </p>
                <p>
                  Requested
                  <br />
                  {formatDate(transfer.initiatedAt)}
                </p>

                <p>
                  Status
                  <br />
                  <span className="text-[#FFD648] font-medium text-[12px] bg-[#FFF9E5] px-2 py-1">
                    {transfer.status}
                  </span>
                </p>
              </div>

              <OperationReviewActions
                kind="transfer"
                id={transfer.id}
                canReview={!["APPROVED", "REJECTED", "CANCELLED"].includes(transfer.status)}
                approveLabel="Approve Transfer"
              />
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
