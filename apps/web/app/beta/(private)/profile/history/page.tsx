import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { fetchWardrobe, fetchWardrobePiece } from "@/features/wardrobe";
import { getSessionCookieHeader } from "@/features/auth/server/session";
import { SectionHead } from "@/components/ui";

interface HistoryEvent {
  id: string;
  pieceName: string;
  pieceId: string;
  date: string;
  type: string;
}

export default async function HistoryPage() {
  const cookie = await getSessionCookieHeader();
  const wardrobe = await fetchWardrobe(cookie).catch(() => []);
  const t = await getTranslations("history");

  const events: HistoryEvent[] = [];

  for (const item of wardrobe.slice(0, 10)) {
    try {
      const detail = await fetchWardrobePiece(item.id, cookie);
      const history = detail.ownershipHistory as
        | Array<{
            acquiredAt: string;
            acquisitionType: string;
          }>
        | undefined;

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

  events.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <>
      <SectionHead title="History" />

      {events.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} />
      ) : (
        <ul className="space-y-4">
          {events.map((event) => (
            <li key={event.id} className="border border-border bg-white p-6">
              <p className="text-xs tracking-[0.14em] uppercase text-(--color-text-muted)">
                {t("certificateIssued")}
              </p>
              <Link
                href={`/beta/profile/wardrobe/${event.pieceId}`}
                className="mt-2 block font-english text-lg text-(--color-text) hover:text-[#BC776E]"
              >
                {event.pieceName}
              </Link>
              <p className="mt-2 text-sm text-(--color-text-muted)">
                {new Date(event.date).toLocaleDateString()} · {event.type}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
