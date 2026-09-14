import { PieceEditForm } from "@/features/admin";
import { fetchAdminPieceDetail } from "@/features/admin/api/fetch-admin-pieces";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ApiError } from "@/shared/lib/send-request";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminPieceEditPage({
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

  return (
    <>
      <div className="flex gap-[16px] px-7.5 py-3 [&>div]:rounded-xl [&>div]:h-15.5 [&>div]:bg-white">
        <div className="flex items-center justify-center w-15.5">
          <Link href={`/admin/pieces/${id}`}>
            <ArrowLeft className="size-6" />
          </Link>
        </div>
        <div className="w-full px-7.5 flex items-center justify-between">
          <h4 className="font-bold text-h6 text-neutral-800">Edit Piece</h4>
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
          <div className="pt-5">
            <PieceEditForm
              pieceId={id}
              initial={{
                name: String(piece.name ?? ""),
                nameAr: String(piece.nameAr ?? ""),
                story: String(piece.story ?? ""),
                storyAr: String(piece.storyAr ?? ""),
                material: String(piece.material ?? ""),
                weight: String(piece.weight ?? "1"),
                dimensions: String(piece.dimensions ?? ""),
                price: String(piece.price ?? "0"),
                notes: String(piece.notes ?? ""),
                isActive: Boolean(piece.isActive),
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
