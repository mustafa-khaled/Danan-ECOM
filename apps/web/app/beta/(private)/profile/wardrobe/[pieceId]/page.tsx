import { notFound } from "next/navigation";
import { ApiError } from "@/shared/lib/send-request";
import { fetchWardrobePiece } from "@/features/wardrobe";
import { getSessionCookieHeader } from "@/features/auth/server/session";
import type { PieceDetail } from "@/features/pieces";
import PieceDetails from "@/components/piece-details";
import Container from "@/components/ui/container";

interface WardrobePiecePageProps {
  params: Promise<{ pieceId: string }>;
}

export default async function WardrobePiecePage({
  params,
}: WardrobePiecePageProps) {
  const { pieceId } = await params;
  const cookie = await getSessionCookieHeader();

  let piece: Record<string, unknown>;
  try {
    piece = await fetchWardrobePiece(pieceId, cookie);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const catalog = piece as unknown as PieceDetail;

  return (
    <div className="w-full pb-5">
      <Container>
        <PieceDetails
          piece={{
            ...catalog,
            imageUrls: catalog.imageUrls?.length
              ? catalog.imageUrls
              : ((piece.images as string[] | undefined) ?? []),
            collection:
              typeof catalog.collection === "string"
                ? { name: catalog.collection, slug: "" }
                : catalog.collection,
            specifications: catalog.specifications ?? [],
            price: catalog.price ?? "0",
            currency: catalog.currency ?? "SAR",
          }}
          isWardrobe
          wardrobeInfo={{
            pieceId,
            serialNumber: String(piece.serialNumber),
            status: String(piece.status),
            activeTransfer: piece.activeTransfer as { id: string } | undefined,
          }}
        />
      </Container>
    </div>
  );
}
