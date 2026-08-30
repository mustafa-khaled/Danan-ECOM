import { getTranslations } from "next-intl/server";
import { SectionHead } from "@/components/ui";
import { fetchTransfers } from "@/features/transfers";
import { getSessionCookieHeader } from "@/features/auth/server/session";
import { TransfersList } from "@/features/profile/components";

export default async function TransfersPage() {
  const cookie = await getSessionCookieHeader();
  const transfers = await fetchTransfers(cookie).catch(() => []);
  const t = await getTranslations("transfers");

  return (
    <>
      <SectionHead
        title="Transfers"
        className="[&_h2]:leading-[100%]! lg:mb-[32px] mb-[16px] lg:[&_h2]:text-[32px] [&_h2]:text-h4"
      />

      <TransfersList
        transfers={transfers}
        emptyTitle={t("empty")}
        emptyDescription={t("emptyDescription")}
      />
    </>
  );
}
