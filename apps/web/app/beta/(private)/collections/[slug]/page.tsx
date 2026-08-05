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
import Container from "@/components/ui/container";

interface CollectionDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CollectionDetailPage({
  params,
}: CollectionDetailPageProps) {
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
      <section className="mb-10 overflow-hidden">
        <div className="relative h-[calc(100dvh-78px)] md:h-[calc(100dvh-115px)] w-full bg-(--color-surface)">
          {collection.coverImageUrl ? (
            <Image
              src={collection.coverImageUrl}
              alt={collection.name}
              fill
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full min-h-48 items-center justify-center font-display text-4xl text-(--color-text-muted)">
              DADAN
            </div>
          )}
        </div>
        <div className="py-6 sm:py-8 px-4 text-center">
          <h1 className="font-english rtl:font-arabic text-3xl sm:text-4xl md:text-5xl font-bold text-(--color-text)">
            {collection.name}
          </h1>
        </div>
      </section>

      <Container className="pb-11">
        {collection.description ? (
          <article className="mb-10 sm:mb-14 mx-auto max-w-2xl text-center px-4">
            <h2 className="font-english rtl:font-arabic text-xl sm:text-2xl font-bold text-(--color-text) mb-3">
              {t("theStory")}
            </h2>
            <p className="font-manrope rtl:font-arabic text-sm sm:text-base md:text-lg leading-relaxed text-(--color-text-muted)">
              {collection.description}
            </p>
          </article>
        ) : null}

        <h2 className="mb-6 font-english rtl:font-arabic text-2xl sm:text-3xl text-(--color-text)">
          {t("pieces")}
        </h2>

        {collection.designs.length === 0 ? (
          <EmptyState
            title={t("empty")}
            description={t("emptyDescription")}
            action={{ href: "/beta/collections", label: t("title") }}
          />
        ) : (
          <section className="grid lg:gap-6 gap-2 grid-cols-2 lg:grid-cols-3">
            {collection.designs.map((design) => (
              <Link key={design.id} href={`/beta/pieces/${design.slug}`}>
                <PieceCard
                  piece={{
                    id: design.id,
                    name: design.name,
                    serialNumber: "Available",
                    imageUrl: design.imageUrls[0],
                    collectionName: collection.name,
                    price: formatPrice(
                      design.basePrice,
                      design.currency,
                      locale,
                    ),
                  }}
                  showExplore
                />
              </Link>
            ))}
          </section>
        )}
      </Container>
    </>
  );
}
