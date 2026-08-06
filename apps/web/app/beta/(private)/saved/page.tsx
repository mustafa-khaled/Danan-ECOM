import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AccountLayout, PieceCard } from "@/components/ui";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { fetchSaved } from "@/features/saved";
import { getSessionCookieHeader } from "@/features/auth/server/session";

export default async function SavedPage() {
  const cookie = await getSessionCookieHeader();
  const saved = await fetchSaved(cookie);
  const t = await getTranslations("saved");

  return (
    <>
      <AccountLayout title={t("title")}>
        <p className="mb-6 text-sm text-[var(--color-text-muted)]">
          {t("count", { count: saved.length })}
        </p>

        {saved.length === 0 ? (
          <EmptyState
            title={t("empty")}
            description={t("emptyDescription")}
            action={{ href: "/beta/collections", label: t("title") }}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {saved.map((entry) => {
              const href = entry.piece.design.slug
                ? `/beta/pieces/${entry.piece.design.slug}`
                : `/beta/profile/wardrobe/${entry.piece.id}`;
              return (
                <Link key={entry.piece.id} href={href}>
                  <PieceCard
                    piece={{
                      id: entry.piece.id,
                      name: entry.piece.design.name,
                      serialNumber: entry.piece.serialNumber,
                      imageUrl: entry.piece.design.imageUrls?.[0],
                      collectionName: entry.piece.design.collection?.name,
                    }}
                    showExplore
                  />
                </Link>
              );
            })}
          </div>
        )}
      </AccountLayout>
    </>
  );
}
