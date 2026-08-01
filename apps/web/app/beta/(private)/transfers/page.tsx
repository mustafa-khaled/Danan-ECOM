import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SerialBadge, StatusPill, WardrobeLayout } from "@/components/ui";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { fetchTransfers } from "@/features/transfers";
import { fetchWardrobe } from "@/features/wardrobe";
import { formatTransferStatus } from "@/shared/utils/format";
import { getSessionCookieHeader } from "@/features/auth/server/session";

export default async function TransfersPage() {
  const cookie = await getSessionCookieHeader();
  const [transfers, wardrobe] = await Promise.all([
    fetchTransfers(cookie),
    fetchWardrobe(cookie),
  ]);
  const t = await getTranslations("transfers");
  const tw = await getTranslations("wardrobe");

  const pendingTransfers = transfers.filter((tr) => tr.status === "PENDING").length;

  return (
    <WardrobeLayout
      ownedCount={wardrobe.length}
      certificatesCount={wardrobe.length}
      pendingTransfers={pendingTransfers}
    >
        {transfers.length === 0 ? (
          <EmptyState
            title={t("empty")}
            description={t("emptyDescription")}
            action={{ href: "/beta/wardrobe", label: tw("title") }}
          />
        ) : (
          <ul className="space-y-4">
            {transfers.map((transfer) => (
              <li key={transfer.id}>
                <Link
                  href={`/beta/transfers/${transfer.id}`}
                  className="block border border-[var(--color-border)] bg-white p-6 transition-colors hover:border-[var(--color-accent)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-english text-xl text-[var(--color-text)]">
                        {transfer.piece.name}
                      </p>
                      <div className="mt-2">
                        <SerialBadge serial={transfer.piece.serialNumber} />
                      </div>
                      <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                        {transfer.transferType} · {transfer.otherPartyDisplayName}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
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
      </WardrobeLayout>
  );
}
