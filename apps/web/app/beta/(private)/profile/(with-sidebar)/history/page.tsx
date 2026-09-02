import { getTranslations } from "next-intl/server";
import { fetchWardrobe, fetchWardrobePiece } from "@/features/wardrobe";
import { getSessionCookieHeader } from "@/features/auth/server/session";
import { SectionHead } from "@/components/ui";
import {
  HistoryList,
  HistoryEvent,
} from "@/features/profile/components/history-list";

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
      <SectionHead
        title={t("title")}
        className="[&_h2]:leading-[100%]! lg:mb-[32px] mb-[16px] lg:[&_h2]:text-[32px] [&_h2]:text-h4"
      />
      <HistoryList
        events={events}
        emptyTitle={t("empty")}
        emptyDescription={t("emptyDescription")}
      />
    </>
  );
}
