import Link from "next/link";
import { PieceCard, PrivateLayout } from "@dadan/ui";
import { EmptyState } from "../../../components/empty-state";
import { fetchSaved } from "../../../lib/api";
import { privateNavItems } from "../../../lib/nav";
import { getSessionCookieHeader, requireClientSession } from "../../../lib/session";

export default async function SavedPage() {
  const profile = await requireClientSession();
  const cookie = await getSessionCookieHeader();
  const saved = await fetchSaved(cookie);

  return (
    <PrivateLayout clientName={profile.displayName} navItems={privateNavItems}>
      <header className="mb-10 space-y-3">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--color-gold-light)]">Bookmarked</p>
        <h1 className="font-display text-4xl text-[var(--color-ivory)]">Saved Pieces</h1>
        <p className="text-[var(--color-ivory-muted)]">Pieces you have saved for later.</p>
      </header>

      {saved.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          description="Save pieces while browsing designs to build your shortlist."
          action={{ href: "/collections", label: "Browse Collections" }}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((entry) => {
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
    </PrivateLayout>
  );
}
