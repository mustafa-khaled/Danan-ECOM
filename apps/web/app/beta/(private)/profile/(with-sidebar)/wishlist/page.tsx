import { getTranslations } from "next-intl/server";
import { SectionHead } from "@/components/ui";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { fetchSaved, SavedPieceCard } from "@/features/saved";
import { getSessionCookieHeader } from "@/features/auth/server/session";

export default async function WishlistPage() {
  const cookie = await getSessionCookieHeader();
  const saved = await fetchSaved(cookie);
  const t = await getTranslations("saved");
  const tc = await getTranslations("collections");

  return (
    <>
      <SectionHead
        title={t("title")}
        subtitle={t("count", { count: saved.length })}
        className="[&_h2]:leading-[100%]! lg:mb-[32px] mb-[16px] lg:[&_h2]:text-[32px] lg:[&_p]:text-h4 [&_p]:text-[14px] lg:[&_p]:mt-[16px] [&_h2]:text-h4 "
      />

      {saved.length === 0 ? (
        <EmptyState
          title={t("empty")}
          description={t("emptyDescription")}
          action={{ href: "/beta/collections", label: tc("title") }}
        />
      ) : (
        <div className="grid gap-2 sm:gap-4 sm:grid-cols-2">
          {saved.map((entry) => (
            <SavedPieceCard
              key={entry.piece.id}
              piece={{
                id: entry.piece.id,
                name: entry.piece.name,
                slug: entry.piece.slug,
                imageUrl: entry.piece.mainImageUrl ?? entry.piece.imageUrls?.[0],
                imageLqip: entry.piece.mainImageLqip,
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
