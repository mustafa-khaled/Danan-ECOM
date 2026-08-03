import { CollectionsBanner } from "@/features/collections";
import { getSessionCookieHeader } from "@/features/auth/server/session";
import CollectionsGrid from "@/features/collections/components/collections-grid";
import Container from "@/components/ui/container";
import { fetchWardrobe } from "@/features/wardrobe";
import { fetchSaved } from "@/features/saved";
import { OwnedPieceItem, SavedPieceItem } from "@/features/collections/types";

export default async function CollectionsPage() {
  const cookie = await getSessionCookieHeader();

  let ownedPieces: OwnedPieceItem[] = [];
  let savedPieces: SavedPieceItem[] = [];

  try {
    const wardrobeData = await fetchWardrobe(cookie);
    if (wardrobeData && Array.isArray(wardrobeData)) {
      ownedPieces = wardrobeData.map((item) => ({
        id: item.id,
        name: item.design.name,
        serialNumber: item.serialNumber,
        imageUrl: item.design.images?.[0],
        acquiredAt: item.ownershipHistory?.[0]?.acquiredAt
          ? `OWNED SINCE: ${new Date(item.ownershipHistory[0].acquiredAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase()}`
          : "OWNED SINCE: JUNE 2022",
        slug: item.design.name
          ? item.design.name.toLowerCase().replace(/\s+/g, "-")
          : item.id,
      }));
    }
  } catch {
    // Fallback to default demo items if unauthenticated or endpoint unpopulated
  }

  try {
    const savedData = await fetchSaved(cookie);
    if (savedData && Array.isArray(savedData)) {
      savedPieces = savedData.map((entry) => ({
        id: entry.piece.id,
        name: entry.piece.design.name,
        serialNumber: entry.piece.serialNumber,
        imageUrl: entry.piece.design.imageUrls?.[0],
        collectionName: entry.piece.design.collection?.name,
        slug: entry.piece.design.slug,
      }));
    }
  } catch {
    // Fallback to default demo items if unauthenticated or endpoint unpopulated
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
