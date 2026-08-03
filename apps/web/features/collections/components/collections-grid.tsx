"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { PieceCard } from "@/components/ui/PieceCard";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { SectionHead } from "@/components/ui";
import { OwnedPieceItem, SavedPieceItem } from "../types";

interface CollectionsGridProps {
  ownedPieces?: OwnedPieceItem[];
  savedPieces?: SavedPieceItem[];
}

export default function CollectionsGrid({
  ownedPieces = [],
  savedPieces = [],
}: CollectionsGridProps) {
  const [activeTab, setActiveTab] = useState<"collection" | "wishlist">(
    "collection",
  );
  const t = useTranslations("myCollection");

  const currentItems = activeTab === "collection" ? ownedPieces : savedPieces;

  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-12 py-8">
      {/* Left Sidebar Navigation */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("collection")}
            className={`w-full text-left px-3 py-2.5 md:px-5 md:py-3.5 text-xs md:text-sm font-medium transition-colors duration-200 ${
              activeTab === "collection"
                ? "bg-[#B56B5D] text-white"
                : "bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#1A1A1A]"
            }`}
          >
            {t("myCollection")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("wishlist")}
            className={`w-full text-left px-3 py-2.5 md:px-5 md:py-3.5 text-xs md:text-sm font-medium transition-colors duration-200 ${
              activeTab === "wishlist"
                ? "bg-[#B56B5D] text-white"
                : "bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#1A1A1A]"
            }`}
          >
            {t("wishList")}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        <SectionHead
          title={activeTab === "collection" ? t("collectionSummary") : t("wishListSummary")}
          subtitle={
            activeTab === "collection"
              ? t("ownedPieces", { count: ownedPieces.length })
              : t("savedPieces", { count: savedPieces.length })
          }
        />

        {currentItems.length === 0 ? (
          <EmptyState
            title={
              activeTab === "collection" ? t("noOwnedPieces") : t("noSavedPieces")
            }
            description={
              activeTab === "collection"
                ? t("noOwnedDescription")
                : t("noSavedDescription")
            }
          />
        ) : (
          <div
            className={`grid gap-6 lg:grid-cols-3 ${currentItems.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
          >
            {activeTab === "collection"
              ? (ownedPieces as OwnedPieceItem[]).map((piece, index) => {
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
                          subtitle:
                            piece.acquiredAt || t("ownedSinceFallback"),
                          imageUrl: piece.imageUrl,
                        }}
                        showExplore
                      />
                    </Link>
                  );
                })
              : (savedPieces as SavedPieceItem[]).map((piece, index) => {
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
