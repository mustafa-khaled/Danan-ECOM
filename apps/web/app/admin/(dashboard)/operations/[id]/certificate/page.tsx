import { fetchAdminOperationDetail } from "@/features/admin/api/fetch-admin-operations";
import { fetchAdminPieceDetail } from "@/features/admin/api/fetch-admin-pieces";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ApiError } from "@/shared/lib/send-request";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
      issuedAt = formatDate(active?.issuedAt);
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
            <ArrowLeft className="size-6" />
          </Link>
        </div>
        <div className="w-full px-7.5 flex items-center justify-between">
          <h4 className="font-bold text-h6 text-neutral-800">
            Operation Certificate
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
            {piece?.name || text(operation.type) || "Certificate"}
          </h1>
          <div className="pt-5 grid grid-cols-2 gap-x-[32px] gap-y-3">
            <ReadField label="Serial" value={piece?.serialNumber ?? ""} />
            <ReadField label="Certificate number" value={certificateNumber} />
            <ReadField label="Issued" value={issuedAt} />
            <ReadField label="Owner" value={ownerName} />
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
