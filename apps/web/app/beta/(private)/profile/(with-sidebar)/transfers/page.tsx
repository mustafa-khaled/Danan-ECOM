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
        subtitle="Manage outgoing and incoming ownership transfer requests"
      />

      <TransfersList
        transfers={transfers}
        emptyTitle={t("empty")}
        emptyDescription={t("emptyDescription")}
      />
    </>
  );
}

