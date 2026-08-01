import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { fetchCollections } from "@/features/collections";
import { getSessionCookieHeader } from "@/features/auth/server/session";

export default async function CollectionsPage() {
  const cookie = await getSessionCookieHeader();
  const collections = await fetchCollections(cookie);
  const t = await getTranslations("collections");

  return (
    <>
      <header className="mb-10 space-y-3">
        <h1 className="font-english text-4xl text-[var(--color-text)]">{t("title")}</h1>
      </header>

      {collections.length === 0 ? (
        <EmptyState
          title={t("empty")}
          description={t("emptyDescription")}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/beta/collections/${collection.slug}`}
              className="group overflow-hidden border border-[var(--color-border)] bg-white transition-colors hover:border-[var(--color-accent)]"
            >
              <div className="relative aspect-[4/3] bg-[var(--color-surface)]">
                {collection.coverImageUrl ? (
                  <Image
                    src={collection.coverImageUrl}
                    alt={collection.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-display text-2xl text-[var(--color-text-muted)]">
                    DADAN
                  </div>
                )}
              </div>
              <div className="p-6">
                <p className="text-xs tracking-[0.14em] uppercase text-[var(--color-text-muted)]">
                  {collection.pieceCount} {t("pieces")}
                </p>
                <h2 className="mt-2 font-english text-2xl text-[var(--color-text)]">
                  {collection.name}
                </h2>
                {collection.description ? (
                  <p className="mt-3 line-clamp-2 text-sm text-[var(--color-text-muted)]">
                    {collection.description}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
