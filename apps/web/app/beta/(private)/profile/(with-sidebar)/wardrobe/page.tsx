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
        title={t("owned")}
        subtitle={t("ownedSubtitle")}
        className="[&_h2]:leading-[100%]! lg:mb-[32px] mb-[16px] lg:[&_h2]:text-[32px] lg:[&_p]:text-h4 [&_p]:text-[14px] lg:[&_p]:mt-[16px] [&_p]:mt-2 [&_h2]:text-h4 "
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
                  imageUrl: item.design.images[0],
                  ownedSince: item?.ownershipHistory?.[0]?.acquiredAt
                    ? new Date(item.ownershipHistory[0].acquiredAt)
                        .toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })
                        .toUpperCase()
                    : undefined,
                }}
              />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
