import Link from "next/link";
import { PrivateLayout, SerialBadge, StatusPill } from "@dadan/ui";
import { EmptyState } from "../../../components/empty-state";
import { fetchTransfers } from "../../../lib/api";
import { formatTransferStatus, privateNavItems } from "../../../lib/nav";
import { getSessionCookieHeader, requireClientSession } from "../../../lib/session";

export default async function TransfersPage() {
  const profile = await requireClientSession();
  const cookie = await getSessionCookieHeader();
  const transfers = await fetchTransfers(cookie);

  return (
    <PrivateLayout clientName={profile.displayName} navItems={privateNavItems}>
      <header className="mb-10 space-y-3">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--color-gold-light)]">Transfers</p>
        <h1 className="font-display text-4xl text-[var(--color-ivory)]">Piece Transfers</h1>
        <p className="text-[var(--color-ivory-muted)]">
          Initiated and received transfers requiring your confirmation.
        </p>
      </header>

      {transfers.length === 0 ? (
        <EmptyState
          title="No transfers"
          description="Transfer requests you send or receive will appear here."
          action={{ href: "/wardrobe", label: "View Wardrobe" }}
        />
      ) : (
        <ul className="space-y-4">
          {transfers.map((transfer) => (
            <li key={transfer.id}>
              <Link
                href={`/transfers/${transfer.id}`}
                className="block rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-colors hover:border-[var(--color-gold)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-xl text-[var(--color-ivory)]">
                      {transfer.piece.name}
                    </p>
                    <div className="mt-2">
                      <SerialBadge serial={transfer.piece.serialNumber} />
                    </div>
                    <p className="mt-3 text-sm text-[var(--color-ivory-muted)]">
                      With {transfer.otherPartyDisplayName} · {transfer.transferType}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-ivory-muted)]">
                      {new Date(transfer.initiatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusPill status={formatTransferStatus(transfer.status)} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PrivateLayout>
  );
}
