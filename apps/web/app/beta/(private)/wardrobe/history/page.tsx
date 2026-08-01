import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { WardrobeLayout } from "@/components/ui";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { fetchWardrobe, fetchWardrobePiece } from "@/features/wardrobe";
import { fetchTransfers } from "@/features/transfers";
import { getSessionCookieHeader } from "@/features/auth/server/session";

interface HistoryEvent {
  id: string;
  pieceName: string;
  pieceId: string;
  date: string;
  type: string;
}

export default async function HistoryPage() {
  const cookie = await getSessionCookieHeader();
  const [wardrobe, transfers] = await Promise.all([
    fetchWardrobe(cookie),
    fetchTransfers(cookie),
  ]);
  const t = await getTranslations("history");

  const pendingTransfers = transfers.filter((tr) => tr.status === "PENDING").length;

  const events: HistoryEvent[] = [];

  for (const item of wardrobe.slice(0, 10)) {
    try {
      const detail = await fetchWardrobePiece(item.id, cookie);
      const history = detail.ownershipHistory as Array<{
        acquiredAt: string;
        acquisitionType: string;
      }> | undefined;

      if (history) {
        for (const record of history) {
          events.push({
            id: `${item.id}-${record.acquiredAt}`,
            pieceName: item.design.name,
            pieceId: item.id,
            date: record.acquiredAt,
            type: record.acquisitionType,
          });
        }
      }
    } catch {
      events.push({
        id: item.id,
        pieceName: item.design.name,
        pieceId: item.id,
        date: new Date().toISOString(),
        type: "OWNED",
      });
    }
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      <WardrobeLayout
        ownedCount={wardrobe.length}
        certificatesCount={wardrobe.length}
        pendingTransfers={pendingTransfers}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-english text-xl text-[var(--color-text)]">{t("title")}</h2>
          <span className="text-sm text-[var(--color-text-muted)]">{t("thisWeek")}</span>
        </div>

        {events.length === 0 ? (
          <EmptyState title={t("empty")} description={t("emptyDescription")} />
        ) : (
          <ul className="space-y-4">
            {events.map((event) => (
              <li
                key={event.id}
                className="border border-[var(--color-border)] bg-white p-6"
              >
                <p className="text-xs tracking-[0.14em] uppercase text-[var(--color-text-muted)]">
                  {t("certificateIssued")}
                </p>
                <Link
                  href={`/beta/wardrobe/${event.pieceId}`}
                  className="mt-2 block font-english text-lg text-[var(--color-text)] hover:text-[var(--color-accent)]"
                >
                  {event.pieceName}
                </Link>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  {new Date(event.date).toLocaleDateString()} · {event.type}
                </p>
              </li>
            ))}
          </ul>
        )}
      </WardrobeLayout>
    </>
  );
}
