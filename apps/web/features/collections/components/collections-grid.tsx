"use client";

import { useState } from "react";
import Link from "next/link";
import { PieceCard } from "@/components/ui/PieceCard";
import { EmptyState } from "@/shared/components/feedback/empty-state";

export interface OwnedPieceItem {
  id: string;
  name: string;
  serialNumber?: string;
  imageUrl?: string | null;
  acquiredAt?: string;
  slug?: string;
}

export interface SavedPieceItem {
  id: string;
  name: string;
  serialNumber?: string;
  imageUrl?: string | null;
  collectionName?: string;
  price?: string;
  slug?: string;
}

const DEFAULT_OWNED_PIECES: OwnedPieceItem[] = [
  {
    id: "owned-1",
    name: "HERITAGE PENDANT",
    acquiredAt: "OWNED SINCE: JUNE 2022",
    imageUrl: "/assets/heritage-pendant.png",
    slug: "heritage-pendant",
  },
  {
    id: "owned-2",
    name: "HERITAGE PENDANT",
    acquiredAt: "OWNED SINCE: JUNE 2022",
    imageUrl: "/assets/heritage-pendant2.png",
    slug: "heritage-pendant",
  },
  {
    id: "owned-3",
    name: "HERITAGE PENDANT",
    acquiredAt: "OWNED SINCE: JUNE 2022",
    imageUrl: "/assets/W7.png",
    slug: "heritage-pendant",
  },
];

const DEFAULT_SAVED_PIECES: SavedPieceItem[] = [
  {
    id: "saved-1",
    name: "MAWADDAH PENDANT",
    collectionName: "HERITAGE COLLECTION",
    imageUrl: "/assets/mawaddah.png",
    slug: "mawaddah",
  },
  {
    id: "saved-2",
    name: "TRIANGLE PENDANT",
    collectionName: "DADAN COLLECTION",
    imageUrl: "/assets/W10.png",
    slug: "triangle-pendant",
  },
];

interface CollectionsGridProps {
  ownedPieces?: OwnedPieceItem[];
  savedPieces?: SavedPieceItem[];
}

export default function CollectionsGrid({
  ownedPieces = DEFAULT_OWNED_PIECES,
  savedPieces = DEFAULT_SAVED_PIECES,
}: CollectionsGridProps) {
  const [activeTab, setActiveTab] = useState<"collection" | "wishlist">("collection");

  const displayOwned = ownedPieces.length > 0 ? ownedPieces : DEFAULT_OWNED_PIECES;
  const displaySaved = savedPieces.length > 0 ? savedPieces : DEFAULT_SAVED_PIECES;

  const currentItems = activeTab === "collection" ? displayOwned : displaySaved;

  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-12 py-8">
      {/* Left Sidebar Navigation */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="flex md:flex-col gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("collection")}
            className={`w-full text-left px-5 py-3.5 text-sm font-medium transition-colors duration-200 ${
              activeTab === "collection"
                ? "bg-[#B56B5D] text-white"
                : "bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#1A1A1A]"
            }`}
          >
            My Collection
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("wishlist")}
            className={`w-full text-left px-5 py-3.5 text-sm font-medium transition-colors duration-200 ${
              activeTab === "wishlist"
                ? "bg-[#B56B5D] text-white"
                : "bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#1A1A1A]"
            }`}
          >
            Wish List
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        <div className="mb-8">
          <h2 className="font-english text-2xl md:text-3xl text-(--color-text)">
            {activeTab === "collection" ? "My Collection Summary" : "Wish List Summary"}
          </h2>
          <p className="mt-2 text-sm text-(--color-text-muted)">
            {activeTab === "collection"
              ? `${displayOwned.length} Owned Pieces`
              : `${displaySaved.length} Saved Pieces`}
          </p>
        </div>

        {currentItems.length === 0 ? (
          <EmptyState
            title={activeTab === "collection" ? "No Owned Pieces" : "No Saved Pieces"}
            description={
              activeTab === "collection"
                ? "You haven't registered any pieces in your collection yet."
                : "Your wish list is currently empty."
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activeTab === "collection"
              ? (displayOwned as OwnedPieceItem[]).map((piece) => {
                  const href = piece.slug ? `/beta/pieces/${piece.slug}` : `#`;
                  return (
                    <Link key={piece.id} href={href} className="block">
                      <PieceCard
                        piece={{
                          id: piece.id,
                          name: piece.name,
                          subtitle: piece.acquiredAt || "OWNED SINCE: JUNE 2022",
                          imageUrl: piece.imageUrl,
                        }}
                        showExplore
                      />
                    </Link>
                  );
                })
              : (displaySaved as SavedPieceItem[]).map((piece) => {
                  const href = piece.slug ? `/beta/pieces/${piece.slug}` : `#`;
                  return (
                    <Link key={piece.id} href={href} className="block">
                      <PieceCard
                        piece={{
                          id: piece.id,
                          name: piece.name,
                          collectionName: piece.collectionName,
                          price: piece.price,
                          imageUrl: piece.imageUrl,
                        }}
                        showExplore
                      />
                    </Link>
                  );
                })}
          </div>
        )}
      </main>
    </div>
  );
}

