import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SectionHead, SerialBadge, StatusPill } from "@/components/ui";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { fetchTransfers } from "@/features/transfers";
import { formatTransferStatus } from "@/shared/utils/format";
import { getSessionCookieHeader } from "@/features/auth/server/session";

export default async function TransfersPage() {
  const cookie = await getSessionCookieHeader();
  const transfers = await fetchTransfers(cookie).catch(() => []);
  const t = await getTranslations("transfers");

  return (
    <>
      <SectionHead
        title="Transfers"
        subtitle="Manage outgoing and incoming ownership transfer requests"
      />

      {transfers.length === 0 ? (
        <EmptyState
          title={t("empty")}
          description={t("emptyDescription")}
          action={{ href: "/beta/profile/wardrobe", label: "View Wardrobe" }}
        />
      ) : (
        <ul className="space-y-4">
          {transfers.map((transfer) => (
            <li key={transfer.id}>
              <Link
                href={`/beta/transfers/${transfer.id}`}
                className="block border border-border bg-white p-6 transition-colors hover:border-[#BC776E]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-english text-xl text-(--color-text)">
                      {transfer.piece.name}
                    </p>
                    <div className="mt-2">
                      <SerialBadge serial={transfer.piece.serialNumber} />
                    </div>
                    <p className="mt-3 text-sm text-(--color-text-muted)">
                      {transfer.transferType} · {transfer.otherPartyDisplayName}
                    </p>
                    <p className="mt-1 text-xs text-(--color-text-muted)">
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
    </>
  );
}
