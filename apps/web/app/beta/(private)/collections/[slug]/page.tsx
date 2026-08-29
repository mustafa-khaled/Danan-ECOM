import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PieceCard } from "@/components/ui";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { ApiError } from "@/shared/lib/send-request";
import { fetchCollection } from "@/features/collections";
import { getSessionCookieHeader } from "@/features/auth/server/session";
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

  let collection;
  try {
    collection = await fetchCollection(slug, cookie);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <>
      <section>
        <div className="relative lg:h-215.5 h-155.5  w-full bg-(--color-surface)">
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
      </section>

      <section className="bg-brown-50">
        <Container className="lg:py-[64px] py-[32px]">
          <article className="mb-10 sm:mb-14 mx-auto max-w-2xl text-center px-4">
            <h2 className="font-heading text-h4 font-bold text-neutral-900 lg:text-h1">
              {collection.name}
            </h2>

            {collection.description && (
              <p className="text-h6 font-medium text-neutral-700 lg:text-[32px] mt-[16px] lg:mt-[32px]">
                {t("theStory")}
                <br />
                {collection.description}
              </p>
            )}
          </article>

          {collection.designs.length === 0 ? (
            <EmptyState
              title={t("empty")}
              description={t("emptyDescription")}
              action={{ href: "/beta/collections", label: t("title") }}
            />
          ) : (
            <section className="grid lg:gap-[16px] gap-2 grid-cols-2 lg:grid-cols-3">
              {collection.designs.map((design) => (
                <Link key={design.id} href={`/beta/pieces/${design.slug}`}>
                  <PieceCard
                    piece={{
                      id: design.id,
                      name: design.name,
                      imageUrl: design.imageUrls[0],
                    }}
                  />
                </Link>
              ))}
            </section>
          )}
        </Container>
      </section>
    </>
  );
}
