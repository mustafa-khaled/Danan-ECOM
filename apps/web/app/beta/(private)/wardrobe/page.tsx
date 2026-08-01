import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PieceCard, WardrobeLayout } from "@/components/ui";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { fetchWardrobe } from "@/features/wardrobe";
import { fetchTransfers } from "@/features/transfers";
import { getSessionCookieHeader } from "@/features/auth/server/session";

export default async function WardrobePage() {
  const cookie = await getSessionCookieHeader();
  const [wardrobe, transfers] = await Promise.all([
    fetchWardrobe(cookie),
    fetchTransfers(cookie),
  ]);
  const t = await getTranslations("wardrobe");

  const pendingTransfers = transfers.filter((tr) => tr.status === "PENDING").length;

  return (
    <>
      <WardrobeLayout
        ownedCount={wardrobe.length}
        certificatesCount={wardrobe.length}
        pendingTransfers={pendingTransfers}
      >
        {wardrobe.length === 0 ? (
          <EmptyState
            title={t("empty")}
            description={t("emptyDescription")}
            action={{ href: "/beta/collections", label: t("owned") }}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {wardrobe.map((item) => (
              <Link key={item.id} href={`/beta/wardrobe/${item.id}`}>
                <PieceCard
                  piece={{
                    id: item.id,
                    name: item.design.name,
                    serialNumber: item.serialNumber,
                    imageUrl: item.design.images[0],
                    collectionName: item.design.collection,
                  }}
                  badge="certificateActive"
                />
              </Link>
            ))}
          </div>
        )}
      </WardrobeLayout>
    </>
  );
}
