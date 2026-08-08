import { notFound } from "next/navigation";
import { ApiError } from "@/shared/lib/send-request";
import { fetchWardrobePiece } from "@/features/wardrobe";
import { getSessionCookieHeader } from "@/features/auth/server/session";
import type { DesignDetail } from "@/features/pieces";
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

  const design = piece.design as DesignDetail;

  return (
    <div className="w-full pb-5">
      <Container>
        <PieceDetails
          design={design}
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
