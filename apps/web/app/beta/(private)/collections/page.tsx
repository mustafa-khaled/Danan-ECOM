import { CollectionsBanner } from "@/features/collections";
import { getSessionCookieHeader } from "@/features/auth/server/session";
import CollectionsGrid from "@/features/collections/components/collections-grid";
import Container from "@/components/ui/container";
import { fetchMyCollection } from "@/features/wardrobe";
import { OwnedPieceItem, SavedPieceItem } from "@/features/collections/types";

function formatAcquiredAt(dateStr: string): string {
  const date = new Date(dateStr);
  return `OWNED SINCE: ${date.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase()}`;
}

export default async function CollectionsPage() {
  const cookie = await getSessionCookieHeader();

  let ownedPieces: OwnedPieceItem[] = [];
  let savedPieces: SavedPieceItem[] = [];

  try {
    const collection = await fetchMyCollection(cookie);
    if (collection) {
      ownedPieces = collection.owned.map((item) => ({
        id: item.id,
        name: item.name,
        serialNumber: item.serialNumber,
        imageUrl: item.imageUrl ?? undefined,
        acquiredAt: formatAcquiredAt(item.acquiredAt),
        slug: item.slug,
      }));

      savedPieces = collection.saved.map((item) => ({
        id: item.id,
        name: item.name,
        serialNumber: item.serialNumber,
        imageUrl: item.imageUrl ?? undefined,
        collectionName: item.collection,
        price: item.price,
        currency: item.currency,
        slug: item.slug,
      }));
    }
  } catch {
    // Fallback to empty if unauthenticated or endpoint error
  }

  return (
    <>
      <CollectionsBanner />

      <Container>
        <CollectionsGrid ownedPieces={ownedPieces} savedPieces={savedPieces} />
      </Container>
    </>
  );
}
