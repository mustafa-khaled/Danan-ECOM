import Image from "next/image";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { ClientShell, PieceCard, WelcomeModal } from "@/components/ui";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { fetchCollections, fetchCollection } from "@/features/collections";
import { fetchSaved } from "@/features/saved";
import { fetchWardrobe } from "@/features/wardrobe";
import {
  getSessionCookieHeader,
  requireClientSession,
} from "@/features/auth/server/session";
import { formatPrice } from "@/shared/utils/format";
import type { Locale } from "@/i18n/routing";

export default async function HomePage() {
  const profile = await requireClientSession();
  const cookie = await getSessionCookieHeader();
  const t = await getTranslations("home");
  const locale = (await getLocale()) as Locale;

  const [collections, wardrobe, saved] = await Promise.all([
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
      selectedPieces = [];
    }
  }

  return (
    <ClientShell displayName={profile.displayName}>
      <WelcomeModal displayName={profile.displayName} />

      <section className="relative -mx-4 mb-12 overflow-hidden sm:-mx-8">
        <div className="relative aspect-21/9 bg-(--color-surface)">
          {featured?.coverImageUrl ? (
            <Image
              src={featured.coverImageUrl}
              alt={featured.name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <h1 className="font-english text-4xl text-white sm:text-5xl">
              {t("continueExploring")}
            </h1>
          </div>
        </div>
      </section>

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

      {featured ? (
        <section className="mb-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="font-english text-2xl text-(--color-text)">
              {t("featuredCollection")}
            </h2>
            <Link
              href={`/beta/collections/${featured.slug}`}
              className="text-xs tracking-[0.14em] uppercase text-(--color-text-muted) hover:text-(--color-accent)"
            >
              {t("viewCollection")}{" "}
              <span className="rtl:rotate-180 inline-block">→</span>
            </Link>
          </div>
          <Link
            href={`/beta/collections/${featured.slug}`}
            className="group block overflow-hidden border border-border bg-(--color-surface) transition-colors hover:border-(--color-accent)"
          >
            <div className="grid md:grid-cols-2">
              <div className="relative aspect-4/3 bg-muted md:aspect-auto">
                {featured.coverImageUrl ? (
                  <Image
                    src={featured.coverImageUrl}
                    alt={featured.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : null}
              </div>
              <div className="flex flex-col justify-center p-8">
                <h3 className="font-english text-3xl text-(--color-text)">
                  {featured.name}
                </h3>
                {featured.description ? (
                  <p className="mt-4 text-(--color-text-muted)">
                    {featured.description}
                  </p>
                ) : null}
              </div>
            </div>
          </Link>
        </section>
      ) : null}

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

      <section className="mb-16 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="font-english text-2xl text-(--color-text)">
            {t("aboutDadan")}
          </h2>
          <p className="mt-4 text-(--color-text-muted)">
            {t("aboutDescription")}
          </p>
        </div>
        <div className="relative aspect-4/3 bg-(--color-surface)">
          <Image
            src="/assets/dadan-model.png"
            alt="DADAN"
            fill
            className="object-cover"
          />
        </div>
      </section>

      {saved.length > 0 ? (
        <section>
          <h2 className="mb-6 font-english text-2xl text-(--color-text)">
            {t("selectedForYou")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {saved.slice(0, 2).map((entry) => (
              <Link
                key={entry.piece.id}
                href={`/beta/pieces/${entry.piece.design.slug ?? entry.piece.id}`}
              >
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
            ))}
          </div>
        </section>
      ) : null}
    </ClientShell>
  );
}
