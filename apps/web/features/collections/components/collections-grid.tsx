"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { PieceCard } from "@/components/ui/PieceCard";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { SectionHead } from "@/components/ui";
import { OwnedPieceItem, SavedPieceItem } from "../types";
import Sidebar from "./sidebar";

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
    <div className="flex flex-col gap-6 xl:flex-row lg:items-start lg:gap-12 lg:pt-12 lg:pb-[64px] py-6">
      {/* Left Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} t={t} />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        <h4 className="font-heading text-h4 lg:text-[32px] font-bold">
          {activeTab === "collection"
            ? t("collectionSummary")
            : t("wishListSummary")}
        </h4>
        <p className="lg:mt-6 lg:mb-[32px] mb-[16px] mt-2 font-medium lg:text-h4 text-h6">
          {activeTab === "collection"
            ? t("ownedPieces", { count: ownedPieces.length })
            : t("savedPieces", { count: savedPieces.length })}
        </p>

        {currentItems.length === 0 ? (
          <EmptyState
            title={
              activeTab === "collection"
                ? t("noOwnedPieces")
                : t("noSavedPieces")
            }
            description={
              activeTab === "collection"
                ? t("noOwnedDescription")
                : t("noSavedDescription")
            }
          />
        ) : (
          <div
            className={`grid gap-2 sm:gap-4 lg:grid-cols-3 ${currentItems.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
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
                          ownedSince:
                            piece.acquiredAt || t("ownedSinceFallback"),
                          imageUrl: piece.imageUrl,
                        }}
                        className="lg:max-h-139.75!"
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
                          imageUrl: piece.imageUrl,
                        }}
                        className="lg:max-h-139.75!"
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
