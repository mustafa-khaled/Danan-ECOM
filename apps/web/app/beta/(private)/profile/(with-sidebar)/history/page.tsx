import { getTranslations } from "next-intl/server";
import { fetchOwnershipHistory } from "@/features/wardrobe";
import { getSessionCookieHeader } from "@/features/auth/server/session";
import { SectionHead } from "@/components/ui";
import { HistoryList } from "@/features/profile/components/history-list";

export default async function HistoryPage() {
  const cookie = await getSessionCookieHeader();
  const t = await getTranslations("history");
  const events = await fetchOwnershipHistory(cookie).catch(() => []);

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
