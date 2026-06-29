import Link from "next/link";
import { GoldDivider, PieceCard, PrivateLayout } from "@dadan/ui";
import { EmptyState } from "../../../components/empty-state";
import {
  fetchCollections,
  fetchSaved,
  fetchWardrobe,
} from "../../../lib/api";
import { privateNavItems } from "../../../lib/nav";
import { getSessionCookieHeader, requireClientSession } from "../../../lib/session";

export default async function HomePage() {
  const profile = await requireClientSession();
  const cookie = await getSessionCookieHeader();

  const [collections, wardrobe, saved] = await Promise.all([
    fetchCollections(cookie),
    fetchWardrobe(cookie),
    fetchSaved(cookie),
  ]);

  const featured = collections[0];

  return (
    <PrivateLayout clientName={profile.displayName} navItems={privateNavItems}>
      <section className="space-y-4">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--color-gold-light)]">
          Welcome back
        </p>
        <h1 className="font-display text-4xl text-[var(--color-ivory)] sm:text-5xl">
          {profile.displayName}
        </h1>
        <p className="max-w-2xl text-[var(--color-ivory-muted)]">
          Your curated house of DADAN pieces, collections, and certificates.
        </p>
      </section>

      {featured ? (
        <section className="mt-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl text-[var(--color-ivory)]">Featured Collection</h2>
            <Link
              href={`/collections/${featured.slug}`}
              className="text-xs tracking-[0.14em] uppercase text-[var(--color-gold-light)] hover:text-[var(--color-gold)]"
            >
              View Collection
            </Link>
          </div>
          <Link
            href={`/collections/${featured.slug}`}
            className="group block overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-luxury)] transition-colors hover:border-[var(--color-gold)]"
          >
            <div className="grid md:grid-cols-2">
              <div className="aspect-[4/3] bg-[var(--color-void)] md:aspect-auto">
                {featured.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featured.coverImageUrl}
                    alt={featured.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full min-h-64 items-center justify-center font-display text-3xl text-[var(--color-ivory-muted)]">
                    DADAN
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center p-8">
                <p className="text-xs tracking-[0.16em] uppercase text-[var(--color-ivory-muted)]">
                  {featured.pieceCount} pieces
                </p>
                <h3 className="mt-2 font-display text-3xl text-[var(--color-ivory)]">
                  {featured.name}
                </h3>
                {featured.description ? (
                  <p className="mt-4 text-[var(--color-ivory-muted)]">{featured.description}</p>
                ) : null}
              </div>
            </div>
          </Link>
        </section>
      ) : null}

      <section className="mt-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl text-[var(--color-ivory)]">Collections</h2>
          <Link
            href="/collections"
            className="text-xs tracking-[0.14em] uppercase text-[var(--color-gold-light)] hover:text-[var(--color-gold)]"
          >
            View All
          </Link>
        </div>
        {collections.length === 0 ? (
          <EmptyState
            title="No collections yet"
            description="Your visibility groups do not include any collections at this time."
            action={{ href: "/collections", label: "Browse Collections" }}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {collections.slice(0, 4).map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.slug}`}
                className="group overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:border-[var(--color-gold)]"
              >
                <div className="aspect-[4/3] bg-[var(--color-void)]">
                  {collection.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={collection.coverImageUrl}
                      alt={collection.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-display text-lg text-[var(--color-ivory-muted)]">
                      DADAN
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg text-[var(--color-ivory)]">{collection.name}</h3>
                  <p className="mt-1 text-xs text-[var(--color-ivory-muted)]">
                    {collection.pieceCount} pieces
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <GoldDivider className="my-12" />

      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl text-[var(--color-ivory)]">Your Wardrobe</h2>
          <Link
            href="/wardrobe"
            className="text-xs tracking-[0.14em] uppercase text-[var(--color-gold-light)] hover:text-[var(--color-gold)]"
          >
            View Wardrobe
          </Link>
        </div>
        {wardrobe.length === 0 ? (
          <EmptyState
            title="Your wardrobe is empty"
            description="Owned pieces and their certificates will appear here after purchase or transfer."
            action={{ href: "/collections", label: "Explore Collections" }}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {wardrobe.slice(0, 3).map((item) => (
              <Link key={item.id} href={`/wardrobe/${item.id}`}>
                <PieceCard
                  piece={{
                    id: item.id,
                    name: item.design.name,
                    serialNumber: item.serialNumber,
                    imageUrl: item.design.images[0],
                    collectionName: item.design.collection,
                  }}
                />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl text-[var(--color-ivory)]">Saved Pieces</h2>
          <Link
            href="/saved"
            className="text-xs tracking-[0.14em] uppercase text-[var(--color-gold-light)] hover:text-[var(--color-gold)]"
          >
            View Saved
          </Link>
        </div>
        {saved.length === 0 ? (
          <EmptyState
            title="Nothing saved yet"
            description="Save pieces while browsing to revisit them later."
            action={{ href: "/collections", label: "Browse Collections" }}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {saved.slice(0, 3).map((entry) => {
              const href = entry.piece.design.slug
                ? `/pieces/${entry.piece.design.slug}`
                : `/wardrobe/${entry.piece.id}`;
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
                  />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </PrivateLayout>
  );
}
