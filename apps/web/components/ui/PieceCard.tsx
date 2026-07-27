import Image from "next/image";
import { SerialBadge } from "./SerialBadge";

export interface PieceCardData {
  id: string;
  name: string;
  serialNumber: string;
  imageUrl?: string | null;
  collectionName?: string;
  price?: string;
}

export interface PieceCardProps {
  piece: PieceCardData;
  className?: string;
  onSelect?: (pieceId: string) => void;
  showExplore?: boolean;
  badge?: "certificateActive";
}

export function PieceCard({
  piece,
  className = "",
  onSelect,
  showExplore = false,
  badge,
}: PieceCardProps) {
  const content = (
    <>
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-surface)]">
        {piece.imageUrl ? (
          <Image
            src={piece.imageUrl}
            alt={piece.name}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--color-text-muted)]">
            <span className="font-display text-lg">DADAN</span>
          </div>
        )}
        {badge === "certificateActive" ? (
          <span className="absolute start-3 top-3 bg-[var(--color-accent)] px-2 py-1 text-[0.625rem] tracking-[0.1em] uppercase text-white">
            Certificate Active
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 p-4">
        {piece.collectionName ? (
          <p className="text-xs tracking-[0.14em] uppercase text-[var(--color-text-muted)]">
            {piece.collectionName}
          </p>
        ) : null}
        <h3 className="font-english text-xl leading-tight text-[var(--color-text)]">
          {piece.name}
        </h3>
        {piece.price ? (
          <p className="font-display text-sm tracking-[0.08em] text-[var(--color-text)]">
            {piece.price}
          </p>
        ) : null}
        {showExplore ? (
          <p className="text-xs tracking-[0.12em] uppercase text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]">
            Explore Piece <span className="rtl:rotate-180 inline-block">→</span>
          </p>
        ) : (
          <SerialBadge serial={piece.serialNumber} />
        )}
      </div>
    </>
  );

  const sharedClasses = [
    "group block overflow-hidden border border-[var(--color-border)] bg-white transition-colors duration-200 hover:border-[var(--color-accent)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (onSelect) {
    return (
      <button type="button" className={`${sharedClasses} text-start`} onClick={() => onSelect(piece.id)}>
        {content}
      </button>
    );
  }

  return <article className={sharedClasses}>{content}</article>;
}
