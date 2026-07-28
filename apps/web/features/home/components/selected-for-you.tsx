import Link from "next/link";
import { PieceCard } from "@/components/ui";
import { formatPrice } from "@/shared/utils/format";
import type { Locale } from "@/i18n/routing";
import { getTranslations, getLocale } from "next-intl/server";
import { fetchCollections, fetchCollection } from "@/features/collections";
import { getSessionCookieHeader } from "@/features/auth/server/session";

export default async function SelectedForYou() {
  const locale = (await getLocale()) as Locale;
  const cookie = await getSessionCookieHeader();

  const t = await getTranslations("home");

  const collections = await fetchCollections(cookie);

  const featured = collections[0];
  let selectedPieces: Array<{
    slug: string;
    name: string;
    images?: string[];
    price?: string;
  }> = [];

  if (featured) {
    try {
      const featuredDetail = await fetchCollection(featured.slug, cookie);
      selectedPieces = featuredDetail.designs.slice(0, 3).map((d) => ({
        slug: d.slug,
        name: d.name,
        images: d.imageUrls,
        price: d.basePrice,
      }));
    } catch {
      selectedPieces = [];
    }
  }

  return (
    <>
      {selectedPieces.length > 0 ? (
        <section className="mb-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-english text-2xl text-(--color-text)">
              {t("selectedForYou")}
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {selectedPieces.map((design) => (
              <Link key={design.slug} href={`/beta/pieces/${design.slug}`}>
                <PieceCard
                  piece={{
                    id: design.slug,
                    name: design.name,
                    serialNumber: design.slug,
                    imageUrl: design.images?.[0],
                    collectionName: featured?.name,
                    price: design.price
                      ? formatPrice(design.price, "SAR", locale)
                      : undefined,
                  }}
                  showExplore
                />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
