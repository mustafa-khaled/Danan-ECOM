import { fetchAdminPieceDetail } from "@/features/admin/api/fetch-admin-pieces";
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

function collectionName(collection: unknown): string {
  if (typeof collection === "string") return collection;
  if (collection && typeof collection === "object" && "name" in collection) {
    return String((collection as { name?: string }).name ?? "");
  }
  return "";
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
  let piece: Record<string, unknown>;
  try {
    piece = (await fetchAdminPieceDetail(id, cookieHeader)) as unknown as Record<
      string,
      unknown
    >;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  console.log(piece)
  return (
    <>
      <div className="flex gap-[16px] px-7.5 py-3 [&>div]:rounded-xl [&>div]:h-15.5 [&>div]:bg-white">
        <div className="flex items-center justify-center w-15.5">
          <Link href="/admin/pieces">
            <ArrowLeft className="size-6" />
          </Link>
        </div>
        <div className="w-full px-7.5 flex items-center justify-between">
          <h4 className="font-bold text-h6 text-neutral-800">Piece Details</h4>
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
            {String(piece.name ?? "")}
          </h1>

          <div className="pt-5 pb-[32px] border-b border-[#E1E4E8]">
            <h4 className="font-heading mb-5 text-h4 font-bold">Piece Overview</h4>
            <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
              <ReadField label="Serial" value={String(piece.serialNumber ?? "")} />
              <ReadField label="Collection" value={collectionName(piece.collection)} />
              <ReadField label="Status" value={String(piece.status ?? "")} />
              <ReadField label="Current Owner" value={ownerName(piece.currentOwner)} />
              <ReadField
                label="Updated"
                value={formatDate(
                  typeof piece.updatedAt === "string" ? piece.updatedAt : null,
                )}
              />
              <ReadField label="Notes" value={String(piece.notes ?? "")} />
            </div>
            <div className="flex items-center justify-end gap-3 w-full mt-[16px]">
              <Link
                href={`/admin/pieces/${id}/edit`}
                className="w-24 h-11 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white flex items-center justify-center"
              >
                Edit
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
