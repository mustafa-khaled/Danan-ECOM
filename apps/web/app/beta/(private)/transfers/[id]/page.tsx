import Link from "next/link";
import { notFound } from "next/navigation";
import { GoldDivider, PrivateLayout, SerialBadge, StatusPill } from "@dadan/ui";
import { TransferActions } from "../../../../../components/transfer-actions";
import { ApiError, fetchTransfer } from "../../../../../lib/api";
import { formatTransferStatus, privateNavItems } from "../../../../../lib/nav";
import { getSessionCookieHeader, requireClientSession } from "../../../../../lib/session";

interface TransferDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TransferDetailPage({ params }: TransferDetailPageProps) {
  const { id } = await params;
  const profile = await requireClientSession();
  const cookie = await getSessionCookieHeader();

  let transfer;
  try {
    transfer = await fetchTransfer(id, cookie);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const role =
    transfer.fromClientId === profile.id
      ? "sender"
      : transfer.toClientId === profile.id
        ? "recipient"
        : "none";

  return (
    <PrivateLayout clientName={profile.displayName} navItems={privateNavItems}>
      <nav aria-label="Breadcrumb" className="mb-6 text-xs tracking-[0.12em] uppercase">
        <ol className="flex flex-wrap items-center gap-2 text-[var(--color-ivory-muted)]">
          <li>
            <Link href="/beta/transfers" className="hover:text-[var(--color-gold-light)]">
              Transfers
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-[var(--color-ivory)]">{transfer.id.slice(0, 8).toUpperCase()}</li>
        </ol>
      </nav>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-[var(--color-ivory)]">Transfer Details</h1>
          <p className="mt-2 text-sm text-[var(--color-ivory-muted)]">
            Initiated {new Date(transfer.initiatedAt).toLocaleString()}
          </p>
        </div>
        <StatusPill status={formatTransferStatus(transfer.status)} />
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="font-display text-xl text-[var(--color-ivory)]">Piece</h2>
          <GoldDivider className="my-4" />
          <div className="aspect-[4/3] overflow-hidden rounded-[var(--radius-item)] bg-[var(--color-void)]">
            {transfer.piece.design.imageUrls[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={transfer.piece.design.imageUrls[0]}
                alt={transfer.piece.design.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-48 items-center justify-center font-display text-2xl text-[var(--color-ivory-muted)]">
                DADAN
              </div>
            )}
          </div>
          <p className="mt-4 font-display text-2xl text-[var(--color-ivory)]">
            {transfer.piece.design.name}
          </p>
          <div className="mt-3">
            <SerialBadge serial={transfer.piece.serialNumber} />
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="font-display text-xl text-[var(--color-ivory)]">Parties</h2>
            <GoldDivider className="my-4" />
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--color-ivory-muted)]">From</dt>
                <dd>{transfer.fromClient.displayName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ivory-muted)]">To</dt>
                <dd>{transfer.toClient.displayName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ivory-muted)]">Type</dt>
                <dd>{transfer.transferType}</dd>
              </div>
            </dl>
          </div>

          <TransferActions transferId={transfer.id} status={transfer.status} role={role} />
        </section>
      </div>
    </PrivateLayout>
  );
}
