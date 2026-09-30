"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PieceCard } from "@/components/ui";
import { useUnsavePiece } from "../hooks/use-unsave-piece";

interface SavedPieceCardProps {
  piece: {
    id: string;
    name: string;
    slug?: string;
    imageUrl?: string | null;
    imageLqip?: string | null;
  };
}

export function SavedPieceCard({ piece }: SavedPieceCardProps) {
  const t = useTranslations("piece");
  const { unsavePiece, isPending, error } = useUnsavePiece();

  async function handleUnsave() {
    try {
      await unsavePiece(piece.id);
    } catch {
      /* error is rendered via the mutation's `error` state */
    }
  }

  const href = piece.slug
    ? `/beta/pieces/${piece.slug}`
    : `/beta/profile/wardrobe/${piece.id}`;

  return (
    <div className="relative">
      <Link href={href} className="block h-full">
        <PieceCard
          piece={{
            id: piece.id,
            name: piece.name,
            imageUrl: piece.imageUrl,
            imageLqip: piece.imageLqip,
          }}
        />
      </Link>

      {/* Sibling of the Link rather than a child: a button nested in an anchor is
          invalid HTML, and PieceCard renders its own button when `onSelect` is set. */}
      <button
        type="button"
        onClick={handleUnsave}
        disabled={isPending}
        aria-label={t("unsave")}
        className="absolute top-2 end-2 z-10 grid size-8 place-items-center rounded-full bg-ds-background/90 text-ds-text shadow-sm transition-colors hover:bg-ds-background disabled:opacity-60"
      >
        <Image
          src="/heart-fill.png"
          alt=""
          width={20}
          height={20}
          className="size-5 object-contain"
        />
      </button>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-ds-error">
          {error instanceof Error ? error.message : t("unsave")}
        </p>
      ) : null}
    </div>
  );
}
