import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PieceCard, SectionHead } from "@/components/ui";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { fetchWardrobe } from "@/features/wardrobe";
import { getSessionCookieHeader } from "@/features/auth/server/session";

export default async function WardrobePage() {
  const cookie = await getSessionCookieHeader();
  const wardrobe = await fetchWardrobe(cookie);
  const t = await getTranslations("wardrobe");

  return (
    <>
      <SectionHead
        title="Owned Pieces"
        subtitle="A curated collection of the pieces that are part of your story"
      />

      {wardrobe.length === 0 ? (
        <EmptyState
          title={t("empty")}
          description={t("emptyDescription")}
          action={{ href: "/beta/collections", label: t("owned") }}
        />
      ) : (
        <div className="grid gap-2 sm:gap-4 sm:grid-cols-2">
          {wardrobe.map((item) => (
            <Link key={item.id} href={`/beta/profile/wardrobe/${item.id}`}>
              <PieceCard
                piece={{
                  id: item.id,
                  name: item.design.name,
                  serialNumber: item.serialNumber,
                  imageUrl: item.design.images[0],
                  collectionName: item.design.collection,
                  subtitle: item?.ownershipHistory?.[0]?.acquiredAt
                    ? `OWNED SINCE: ${new Date(item?.ownershipHistory?.[0]?.acquiredAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase()}`
                    : undefined,
                }}
                showExplore={true}
              />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
