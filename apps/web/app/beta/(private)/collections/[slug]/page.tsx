import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { PieceCard } from "@/components/ui";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { ApiError } from "@/shared/lib/send-request";
import { fetchCollection } from "@/features/collections";
import { formatPrice } from "@/shared/utils/format";
import { getSessionCookieHeader } from "@/features/auth/server/session";
import type { Locale } from "@/i18n/routing";

interface CollectionDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { slug } = await params;
  const cookie = await getSessionCookieHeader();
  const t = await getTranslations("collections");
  const locale = (await getLocale()) as Locale;

  let collection;
  try {
    collection = await fetchCollection(slug, cookie);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <>
      <header className="mb-10 overflow-hidden border border-[var(--color-border)]">
        <div className="relative aspect-[21/9] bg-[var(--color-surface)]">
          {collection.coverImageUrl ? (
            <Image
              src={collection.coverImageUrl}
              alt={collection.name}
              fill
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full min-h-48 items-center justify-center font-display text-4xl text-[var(--color-text-muted)]">
              DADAN
            </div>
          )}
        </div>
        <div className="p-8 text-center">
          <h1 className="font-english text-4xl text-[var(--color-text)]">{collection.name}</h1>
          {collection.description ? (
            <p className="mx-auto mt-4 max-w-2xl text-[var(--color-text-muted)]">
              {collection.description}
            </p>
          ) : null}
        </div>
      </header>

      {collection.description ? (
        <div className="mb-12 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-english text-xl text-[var(--color-text)]">{t("theStory")}</h2>
            <p className="mt-4 text-[var(--color-text-muted)]">{collection.description}</p>
          </div>
          <div>
            <h2 className="font-english text-xl text-[var(--color-text)]">{t("designInspiration")}</h2>
            <p className="mt-4 text-[var(--color-text-muted)]">{collection.description}</p>
          </div>
        </div>
      ) : null}

      <h2 className="mb-6 font-english text-2xl text-[var(--color-text)]">{t("pieces")}</h2>

      {collection.designs.length === 0 ? (
        <EmptyState
          title={t("empty")}
          description={t("emptyDescription")}
          action={{ href: "/beta/collections", label: t("title") }}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collection.designs.map((design) => (
            <Link key={design.id} href={`/beta/pieces/${design.slug}`}>
              <PieceCard
                piece={{
                  id: design.id,
                  name: design.name,
                  serialNumber: "Available",
                  imageUrl: design.imageUrls[0],
                  collectionName: collection.name,
                  price: formatPrice(design.basePrice, design.currency, locale),
                }}
                showExplore
              />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
