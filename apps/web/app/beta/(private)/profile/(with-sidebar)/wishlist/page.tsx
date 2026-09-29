import { PieceCard } from "@/components/ui";
import { Link } from "lucide-react";

export default function WishlistPage() {
  return (
    <div
    //   className={`grid gap-2 sm:gap-4 lg:grid-cols-3 ${currentItems.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
    >
      WishlistPage
      {/* {
        (savedPieces as SavedPieceItem[]).map((piece, index) => {
            const href = piece.slug ? `/beta/pieces/${piece.slug}` : `#`;
            const isLastOdd =
              currentItems.length % 2 !== 0 &&
              index === currentItems.length - 1;
            return (
              <Link
                key={piece.id}
                href={href}
                className={`block ${isLastOdd ? "col-span-2 lg:col-span-1" : ""}`}
              >
                <PieceCard
                  piece={{
                    id: piece.id,
                    name: piece.name,
                    imageUrl: piece.imageUrl,
                  }}
                  className="lg:max-h-139.75!"
                />
              </Link>
            );
          })
      } */}
    </div>
  );
}
