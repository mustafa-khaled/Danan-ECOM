import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { getSessionCookieHeader } from "@/features/auth/server/session";
import { fetchCollections } from "@/features/collections";

export default async function CollectionsCatalog() {
  const cookie = await getSessionCookieHeader();

  const collections = await fetchCollections(cookie).catch(() => []);

  const t = await getTranslations("collections");

  if (collections.length === 0) {
    return (
      <EmptyState title={t("empty")} description={t("emptyDescription")} />
    );
  }

  return (
    <section className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-[16px]">
      {collections.map((collection) => (
        <Link
          key={collection.id}
          href={`/beta/collections/${collection.slug}`}
          className="group flex flex-col"
        >
          <div className="relative aspect-352/360 w-full overflow-hidden bg-ds-surface-warm">
            {collection.coverImageUrl ? (
              <Image
                src={collection.coverImageUrl}
                alt={collection.name}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                placeholder={collection.coverImageLqip ? "blur" : undefined}
                blurDataURL={collection.coverImageLqip ?? undefined}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center font-display text-4xl text-(--color-text-muted)">
                DADAN
              </div>
            )}
          </div>

          <h2 className="mt-[16px] font-heading text-h5 font-bold text-neutral-900 lg:text-h4">
            {collection.name}
          </h2>
          <p className="mt-1 font-body text-sm font-medium text-ds-text-secondary">
            {t("pieceCount", { count: collection.pieceCount })}
          </p>
        </Link>
      ))}
    </section>
  );
}
