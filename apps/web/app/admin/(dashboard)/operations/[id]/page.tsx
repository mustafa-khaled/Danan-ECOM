import { fetchAdminOperationDetail } from "@/features/admin/api/fetch-admin-operations";
import { OperationReviewActions } from "@/features/admin/components/operations/components/operation-review-actions";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ApiError } from "@/shared/lib/send-request";
import { ArrowLeft, Check } from "lucide-react";
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

function displayName(value: unknown) {
  if (value && typeof value === "object" && "displayName" in value) {
    return String((value as { displayName?: string }).displayName ?? "");
  }
  return "";
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

export default async function OperationsDePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kind?: "transfer" | "staff" }>;
}) {
  const { id } = await params;
  const { kind } = await searchParams;
  const cookieHeader = await getAdminCookieHeader();
  let operation;
  try {
    operation = await fetchAdminOperationDetail(id, kind, cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
  const operationKind = operation.kind === "staff" ? "staff" : "transfer";
  const currentOwner =
    displayName(operation.fromClient) || displayName(operation.client);
  const newOwner =
    displayName(operation.toClient) ||
    (operation.collection && typeof operation.collection === "object"
      ? String((operation.collection as { name?: string }).name ?? "")
      : "");
  const requestType = text(operation.transferType) || text(operation.type);
  const requestedAt = formatDate(
    text(operation.initiatedAt) || text(operation.createdAt),
  );
  const status = text(operation.status);
  const canReview = !["APPROVED", "REJECTED", "CANCELLED", "COMPLETED"].includes(status);
  const toClient =
    operation.toClient && typeof operation.toClient === "object"
      ? (operation.toClient as { id?: string; isActive?: boolean })
      : null;
  const fromClient =
    operation.fromClient && typeof operation.fromClient === "object"
      ? (operation.fromClient as { id?: string })
      : null;
  const piece =
    operation.piece && typeof operation.piece === "object"
      ? (operation.piece as { currentOwnerId?: string })
      : null;
  const recipientVerified =
    operationKind === "transfer"
      ? Boolean(operation.recipientConfirmedAt) ||
        ["RECIPIENT_CONFIRMED", "DADAN_REVIEW", "APPROVED"].includes(status)
      : status !== "PENDING";
  const recipientHouseAccess =
    operationKind === "transfer" ? Boolean(toClient?.isActive) : true;
  const ownershipEligible =
    operationKind === "transfer"
      ? status === "APPROVED" ||
        Boolean(piece?.currentOwnerId && piece.currentOwnerId === fromClient?.id)
      : status === "COMPLETED" || status === "APPROVED";

  return (
    <>
      <div className="flex gap-[16px] px-7.5 py-3 [&>div]:rounded-xl [&>div]:h-15.5 [&>div]:bg-white">
        <div className="flex items-center justify-center w-15.5">
          <Link href="/admin/operations">
            <ArrowLeft className="size-6" />
          </Link>
        </div>
        <div className="w-full px-7.5 flex items-center justify-between">
          <h4 className="font-bold text-h6 text-neutral-800">
            {operationKind === "transfer"
              ? "Operations / Transfer Request"
              : "Operations / Staff Request"}
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
            {operationKind === "transfer" ? "Ownership Transfer" : text(operation.type)}
          </h1>

          <div className="pt-5 pb-[32px] border-b border-[#E1E4E8]">
            <h4 className="font-heading mb-5 text-h4 font-bold">
              Ownership Overview
            </h4>

            <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
              <ReadField label="Current Owner" value={currentOwner} />
              <ReadField
                label={operationKind === "transfer" ? "NEW OWNER" : "Target"}
                value={newOwner}
              />
            </div>
          </div>

          <div className="my-[32px] pt-5 border-t border-[#E1E4E8]">
            <h4 className="font-heading mb-5 text-h4 font-bold">
              REQUEST DETAILS
            </h4>

            <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
              <ReadField label="Transfer Type" value={requestType} />
              <ReadField label="Requested" value={requestedAt} />
              <div className="col-span-2">
                <ReadField label="Status" value={status} />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-heading mb-5 text-h4 font-bold">
              REQUIRED ACTION
            </h4>
            <ul className="space-y-[16px] [&>li]:flex [&>li]:gap-[16px] [&>li]:items-center [&>li]:text-[#353D48] [&>li]:font-semibold [&>li]:text-h6 [&>li]:pb-[16px] [&>li:last-child]:pb-[32px] [&>li]:border-b [&>li]:border-[#E1E4E8]">
              <ChecklistItem done={recipientVerified} label="Recipient Verification" />
              <ChecklistItem done={recipientHouseAccess} label="Recipient House Access" />
              <ChecklistItem done={ownershipEligible} label="Ownership Eligibility" />
            </ul>
            <OperationReviewActions
              kind={operationKind}
              id={text(operation.id) || id}
              canReview={canReview}
              approveLabel={
                operationKind === "transfer" ? "Approve Transfer" : "Approve Request"
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <li>
      <span
        className={`w-[16px] h-[16px] rounded-full flex items-center justify-center text-white ${
          done ? "bg-[#1EC58B]" : "bg-[#E1E4E8]"
        }`}
      >
        {done ? <Check className="size-3" /> : null}
      </span>
      {label}{" "}
    </li>
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
