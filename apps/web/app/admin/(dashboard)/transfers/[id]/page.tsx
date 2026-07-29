import { notFound } from "next/navigation";
import { StatusPill } from "@/components/ui";
import { fetchAdminTransferDetail } from "@/features/admin/api/fetch-admin-transfers";
import { getAdminCookieHeader, requireAdminSession } from "@/features/auth/server/admin-session";
import { ApiError } from "@/shared/lib/send-request";
import { TransferActions } from "./transfer-actions";

interface TransferDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

export default async function TransferDetailPage({ params }: TransferDetailPageProps) {
  const { id } = await params;
  const session = await requireAdminSession();
  const cookieHeader = await getAdminCookieHeader();

  let transfer;
  try {
    transfer = await fetchAdminTransferDetail(id, cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const isReview = transfer.status === "DADAN_REVIEW";
  const canActOnTransfer = session.role === "SUPER_ADMIN" && isReview;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-[0.06em] uppercase">
            Transfer Request
          </h1>
          <p className="mt-2 text-sm text-[var(--color-ivory-muted)]">
            {transfer.piece.serialNumber} · {transfer.piece.design.name}
          </p>
        </div>
        <StatusPill
          status={formatStatus(transfer.status)}
          className={
            isReview
              ? "border-[var(--color-warning)]/60 text-[var(--color-warning)]"
              : ""
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="mb-4 font-display text-lg tracking-[0.06em] uppercase text-[var(--color-ivory-muted)]">
            Sender
          </h2>
          <p className="text-lg">{transfer.fromClient.displayName}</p>
          <p className="text-sm text-[var(--color-ivory-muted)]">{transfer.fromClient.email}</p>
          {transfer.senderConfirmedAt && (
            <p className="mt-3 text-xs text-green-500">
              Confirmed: {new Date(transfer.senderConfirmedAt).toLocaleString()}
            </p>
          )}
        </div>

        <div className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="mb-4 font-display text-lg tracking-[0.06em] uppercase text-[var(--color-ivory-muted)]">
            Recipient
          </h2>
          <p className="text-lg">{transfer.toClient.displayName}</p>
          <p className="text-sm text-[var(--color-ivory-muted)]">{transfer.toClient.email}</p>
          {transfer.recipientConfirmedAt && (
            <p className="mt-3 text-xs text-green-500">
              Confirmed: {new Date(transfer.recipientConfirmedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="mb-4 font-display text-lg tracking-[0.06em] uppercase text-[var(--color-ivory-muted)]">
          Transfer Details
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-[0.1em] text-[var(--color-ivory-muted)]">Type</dt>
            <dd className="mt-1">{transfer.transferType.replace(/_/g, " ")}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.1em] text-[var(--color-ivory-muted)]">Initiated</dt>
            <dd className="mt-1">{new Date(transfer.initiatedAt).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.1em] text-[var(--color-ivory-muted)]">Status</dt>
            <dd className="mt-1">{formatStatus(transfer.status)}</dd>
          </div>
          {transfer.completedAt && (
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-[var(--color-ivory-muted)]">Completed</dt>
              <dd className="mt-1">{new Date(transfer.completedAt).toLocaleDateString()}</dd>
            </div>
          )}
        </dl>
      </div>

      {canActOnTransfer && (
        <TransferActions transferId={id} />
      )}

      {!canActOnTransfer && isReview && session.role !== "SUPER_ADMIN" && (
        <div className="rounded-[var(--radius-panel)] border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-6">
          <p className="text-[var(--color-warning)]">
            This transfer requires SUPER_ADMIN approval.
          </p>
        </div>
      )}
    </div>
  );
}
