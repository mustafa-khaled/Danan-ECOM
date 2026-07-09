import Image from "next/image";
import Link from "next/link";
import { PrivateLayout } from "@/components/ui";
import { EmptyState } from "../../../../components/empty-state";
import { fetchCollections } from "@/features/collections";
import { privateNavItems } from "@/shared/lib/nav";
import { getSessionCookieHeader, requireClientSession } from "@/features/auth/server/session";

export default async function CollectionsPage() {
  const profile = await requireClientSession();
  const cookie = await getSessionCookieHeader();
  const collections = await fetchCollections(cookie);

  return (
    <PrivateLayout clientName={profile.displayName} navItems={privateNavItems}>
      <header className="mb-10 space-y-3">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--color-gold-light)]">Curated</p>
        <h1 className="font-display text-4xl text-[var(--color-ivory)]">Collections</h1>
        <p className="max-w-2xl text-[var(--color-ivory-muted)]">
          Explore the houses and stories visible to your private access.
        </p>
      </header>

      {collections.length === 0 ? (
        <EmptyState
          title="No collections available"
          description="There are no collections in your visibility groups at this time."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/beta/collections/${collection.slug}`}
              className="group overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-luxury)] transition-colors hover:border-[var(--color-gold)]"
            >
              <div className="relative aspect-[4/3] bg-[var(--color-void)]">
                {collection.coverImageUrl ? (
                  <Image
                    src={collection.coverImageUrl}
                    alt={collection.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-display text-2xl text-[var(--color-ivory-muted)]">
                    DADAN
                  </div>
                )}
              </div>
              <div className="p-6">
                <p className="text-xs tracking-[0.14em] uppercase text-[var(--color-ivory-muted)]">
                  {collection.pieceCount} pieces
                </p>
                <h2 className="mt-2 font-display text-2xl text-[var(--color-ivory)]">
                  {collection.name}
                </h2>
                {collection.description ? (
                  <p className="mt-3 line-clamp-2 text-sm text-[var(--color-ivory-muted)]">
                    {collection.description}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </PrivateLayout>
  );
}
