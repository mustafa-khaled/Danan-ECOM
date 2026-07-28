import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PieceCard } from "@/components/ui";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { fetchCollections, fetchCollection } from "@/features/collections";
import { fetchSaved } from "@/features/saved";
import { fetchWardrobe } from "@/features/wardrobe";
import { getSessionCookieHeader } from "@/features/auth/server/session";

export default async function YourCollection() {
  const cookie = await getSessionCookieHeader();
  const t = await getTranslations("home");

  const [collections, wardrobe] = await Promise.all([
    fetchCollections(cookie),
    fetchWardrobe(cookie),
    fetchSaved(cookie),
  ]);

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
      selectedPieces = featuredDetail.designs.slice(0, 2).map((d) => ({
        slug: d.slug,
        name: d.name,
        images: d.imageUrls,
        price: d.basePrice,
      }));
    } catch {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      selectedPieces = [];
    }
  }

  return (
    <section className="mb-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="font-english text-2xl text-(--color-text)">
          {t("yourCollection")}
        </h2>
        <Link
          href="/beta/wardrobe"
          className="text-xs tracking-[0.14em] uppercase text-(--color-text-muted) hover:text-(--color-accent)"
        >
          {t("viewCollection")}{" "}
          <span className="rtl:rotate-180 inline-block">→</span>
        </Link>
      </div>
      {wardrobe.length === 0 ? (
        <EmptyState
          title={t("wardrobeEmpty")}
          description={t("wardrobeEmptyDescription")}
          action={{
            href: "/beta/collections",
            label: t("exploreCollections"),
          }}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wardrobe.slice(0, 3).map((item) => (
            <Link key={item.id} href={`/beta/wardrobe/${item.id}`}>
              <PieceCard
                piece={{
                  id: item.id,
                  name: item.design.name,
                  serialNumber: item.serialNumber,
                  imageUrl: item.design.images[0],
                  collectionName: item.design.collection,
                }}
                badge="certificateActive"
              />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
