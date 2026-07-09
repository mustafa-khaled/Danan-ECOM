import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GoldDivider, PieceCard, PrivateLayout } from "@/components/ui";
import { EmptyState } from "../../../../../components/empty-state";
import { ApiError } from "@/shared/lib/send-request";
import { fetchCollection } from "@/features/collections";
import { formatPrice } from "@/shared/utils/format";
import { privateNavItems } from "@/shared/lib/nav";
import { getSessionCookieHeader, requireClientSession } from "@/features/auth/server/session";

interface CollectionDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { slug } = await params;
  const profile = await requireClientSession();
  const cookie = await getSessionCookieHeader();

  let collection;
  try {
    collection = await fetchCollection(slug, cookie);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <PrivateLayout clientName={profile.displayName} navItems={privateNavItems}>
      <nav aria-label="Breadcrumb" className="mb-6 text-xs tracking-[0.12em] uppercase">
        <ol className="flex flex-wrap items-center gap-2 text-[var(--color-ivory-muted)]">
          <li>
            <Link href="/beta/home" className="hover:text-[var(--color-gold-light)]">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/beta/collections" className="hover:text-[var(--color-gold-light)]">
              Collections
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-[var(--color-ivory)]">{collection.name}</li>
        </ol>
      </nav>

      <header className="mb-10 overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="relative aspect-[21/9] bg-[var(--color-void)]">
          {collection.coverImageUrl ? (
            <Image
              src={collection.coverImageUrl}
              alt={collection.name}
              fill
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full min-h-48 items-center justify-center font-display text-4xl text-[var(--color-ivory-muted)]">
              DADAN
            </div>
          )}
        </div>
        <div className="p-8">
          <h1 className="font-display text-4xl text-[var(--color-ivory)]">{collection.name}</h1>
          {collection.description ? (
            <p className="mt-4 max-w-3xl text-[var(--color-ivory-muted)]">{collection.description}</p>
          ) : null}
        </div>
      </header>

      <GoldDivider className="mb-10" />

      <h2 className="mb-6 font-display text-2xl text-[var(--color-ivory)]">Designs</h2>

      {collection.designs.length === 0 ? (
        <EmptyState
          title="No designs in this collection"
          description="Designs will appear here when they become available to your house."
          action={{ href: "/beta/collections", label: "Back to Collections" }}
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
                  price: formatPrice(design.basePrice, design.currency),
                }}
              />
            </Link>
          ))}
        </div>
      )}
    </PrivateLayout>
  );
}
