import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PieceCard } from "@/components/ui";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { fetchCollections, fetchCollection } from "@/features/collections";
import { getSessionCookieHeader } from "@/features/auth/server/session";
import Container from "@/components/ui/container";

interface DesignItem {
  id: string;
  name: string;
  slug: string;
  imageUrls: string[];
  basePrice: string;
  currency: string;
  collectionName: string;
  collectionSlug: string;
}

export default async function PiecesPage() {
  const cookie = await getSessionCookieHeader();
  const t = await getTranslations("pieces");

  let allDesigns: DesignItem[] = [];

  try {
    const collections = await fetchCollections(cookie);

    const collectionDetails = await Promise.all(
      collections.map((c) =>
        fetchCollection(c.slug, cookie).catch(() => null)
      )
    );

    for (const collection of collectionDetails) {
      if (collection) {
        for (const design of collection.designs) {
          allDesigns.push({
            ...design,
            collectionName: collection.name,
            collectionSlug: collection.slug,
          });
        }
      }
    }
  } catch {
    allDesigns = [];
  }

  return (
    <Container className="py-8 md:py-12">
      <header className="mb-8 md:mb-12 text-center">
        <h1 className="font-english rtl:font-arabic text-3xl sm:text-4xl md:text-5xl font-bold text-(--color-text)">
          {t("title")}
        </h1>
        <p className="mt-3 text-sm sm:text-base text-(--color-text-muted) max-w-2xl mx-auto">
          {t("subtitle")}
        </p>
      </header>

      {allDesigns.length === 0 ? (
        <EmptyState
          title={t("empty")}
          description={t("emptyDescription")}
          action={{ href: "/beta/home", label: t("backToHome") }}
        />
      ) : (
        <section className="grid lg:gap-6 gap-2 grid-cols-2 lg:grid-cols-3">
          {allDesigns.map((design) => (
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
  );
}
