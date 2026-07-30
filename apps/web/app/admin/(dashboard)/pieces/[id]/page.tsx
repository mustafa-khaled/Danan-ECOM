import { notFound } from "next/navigation";
import { SerialBadge, StatusPill } from "@/components/ui";
import { fetchAdminPieceDetail } from "@/features/admin/api/fetch-admin-pieces";
import { getAdminCookieHeader, requireAdminSession } from "@/features/auth/server/admin-session";
import { ApiError } from "@/shared/lib/send-request";
import { PieceActions } from "./piece-actions";

interface PieceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PieceDetailPage({ params }: PieceDetailPageProps) {
  const { id } = await params;
  const session = await requireAdminSession();
  const cookieHeader = await getAdminCookieHeader();

  let piece;
  try {
    piece = await fetchAdminPieceDetail(id, cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-[0.06em] uppercase">Piece Detail</h1>
          <p className="mt-2 text-sm text-[var(--color-ivory-muted)]">
            <SerialBadge serial={piece.serialNumber} /> · {piece.designName}
          </p>
        </div>
        <StatusPill status={piece.status.replace(/_/g, " ")} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="mb-4 font-display text-lg tracking-[0.06em] uppercase text-[var(--color-ivory-muted)]">
            Piece Information
          </h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-[var(--color-ivory-muted)]">Serial</dt>
              <dd className="mt-1 font-mono">{piece.serialNumber}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-[var(--color-ivory-muted)]">Design</dt>
              <dd className="mt-1">{piece.designName}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-[var(--color-ivory-muted)]">Collection</dt>
              <dd className="mt-1">{piece.collection}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-[var(--color-ivory-muted)]">Status</dt>
              <dd className="mt-1">{piece.status.replace(/_/g, " ")}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="mb-4 font-display text-lg tracking-[0.06em] uppercase text-[var(--color-ivory-muted)]">
            Ownership
          </h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-[var(--color-ivory-muted)]">Current Owner</dt>
              <dd className="mt-1">{piece.currentOwner ?? "Unassigned"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-[var(--color-ivory-muted)]">Created</dt>
              <dd className="mt-1">{new Date(piece.createdAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>
      </div>

      {(session.role === "SUPER_ADMIN" || session.role === "STAFF") && (
        <PieceActions pieceId={id} currentStatus={piece.status} hasOwner={!!piece.currentOwnerId} />
      )}
    </div>
  );
}
