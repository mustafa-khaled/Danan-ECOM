import Link from "next/link";
import { PieceCard, PrivateLayout } from "@dadan/ui";
import { EmptyState } from "../../../../components/empty-state";
import { fetchWardrobe } from "../../../../lib/api";
import { privateNavItems } from "../../../../lib/nav";
import { getSessionCookieHeader, requireClientSession } from "../../../../lib/session";

export default async function WardrobePage() {
  const profile = await requireClientSession();
  const cookie = await getSessionCookieHeader();
  const wardrobe = await fetchWardrobe(cookie);

  return (
    <PrivateLayout clientName={profile.displayName} navItems={privateNavItems}>
      <header className="mb-10 space-y-3">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--color-gold-light)]">Owned</p>
        <h1 className="font-display text-4xl text-[var(--color-ivory)]">Your Wardrobe</h1>
        <p className="text-[var(--color-ivory-muted)]">
          Pieces you own, with certificates and transfer history.
        </p>
      </header>

      {wardrobe.length === 0 ? (
        <EmptyState
          title="Your wardrobe is empty"
          description="Purchased and transferred pieces will appear here."
          action={{ href: "/beta/collections", label: "Explore Collections" }}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wardrobe.map((item) => (
            <Link key={item.id} href={`/beta/wardrobe/${item.id}`}>
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
    </PrivateLayout>
  );
}
