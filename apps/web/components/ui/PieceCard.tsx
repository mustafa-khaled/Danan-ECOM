import { SerialBadge } from "./SerialBadge";
import { OptimizedImage } from "./OptimizedImage";
import { cn } from "@/lib/utils";

export interface PieceCardData {
  id: string;
  name: string;
  serialNumber?: string;
  imageUrl?: string | null;
  imageLqip?: string | null;
  collectionName?: string;
  subtitle?: string;
  price?: string;
}

export interface PieceCardProps {
  piece: PieceCardData;
  className?: string;
  imageClassName?: string;
  onSelect?: (pieceId: string) => void;
  showExplore?: boolean;
  badge?: "certificateActive";
  priority?: boolean;
}

export function PieceCard({
  piece,
  className = "",
  imageClassName,
  onSelect,
  showExplore = false,
  badge,
  priority = false,
}: PieceCardProps) {
  const content = (
    <>
      <div
        className={cn(
          "relative w-full aspect-square md:aspect-4/5 overflow-hidden bg-ds-surface",
          imageClassName,
        )}
      >
        {piece.imageUrl ? (
          <OptimizedImage
            src={piece.imageUrl}
            alt={piece.name}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
            blurDataURL={piece.imageLqip}
            priority={priority}
            quality={80}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ds-text-muted">
            <span className="font-display text-lg">DADAN</span>
          </div>
        )}
        {badge === "certificateActive" ? (
          <span className="absolute inset-s-3 top-3 bg-ds-secondary px-2 py-1 text-[0.625rem] tracking-widest uppercase text-white">
            Certificate Active
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 md:gap-2 p-3 md:p-4">
        {piece.collectionName ? (
          <p className="text-[0.625rem] md:text-xs tracking-[0.14em] uppercase text-ds-text-secondary">
            {piece.collectionName}
          </p>
        ) : null}
        <h3 className="font-heading text-sm md:text-xl leading-tight text-ds-text">
          {piece.name}
        </h3>
        {piece.subtitle ? (
          <p className="text-[0.625rem] md:text-xs tracking-[0.14em] uppercase text-ds-text-secondary">
            {piece.subtitle}
          </p>
        ) : null}
        {piece.price ? (
          <p className="font-display text-sm tracking-[0.08em] text-ds-text">
            {piece.price}
          </p>
        ) : null}
        {showExplore ? (
          <p className="text-xs text-[#1F5750] font-semibold flex items-center justify-between tracking-[0.12em] text-ds-teal-800 group-hover:text-ds-secondary">
            <span>Explore Piece</span>
            <span className="rtl:rotate-180 inline-block">→</span>
          </p>
        ) : piece.serialNumber ? (
          <SerialBadge serial={piece.serialNumber} />
        ) : null}
      </div>
    </>
  );

  const sharedClasses = cn(
    "group block overflow-hidden border border-ds-border bg-ds-background transition-colors duration-200 hover:border-ds-secondary",
    className,
  );

  if (onSelect) {
    return (
      <button
        type="button"
        className={`${sharedClasses} text-start`}
        onClick={() => onSelect(piece.id)}
      >
        {content}
      </button>
    );
  }

  return <article className={sharedClasses}>{content}</article>;
}
