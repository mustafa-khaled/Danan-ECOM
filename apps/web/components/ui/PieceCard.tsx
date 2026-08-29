import { OptimizedImage } from "./OptimizedImage";
import { cn } from "@/lib/utils";

export interface PieceCardData {
  id: string;
  name: string;
  imageUrl?: string | null;
  imageLqip?: string | null;
  ownedSince?: string;
}

export interface PieceCardProps {
  piece: PieceCardData;
  className?: string;
  imageClassName?: string;
  onSelect?: (pieceId: string) => void;
  priority?: boolean;
}

export function PieceCard({
  piece,
  className = "",
  imageClassName,
  onSelect,
  priority = false,
}: PieceCardProps) {
  const content = (
    <>
      <div
        className={cn(
          "relative w-full lg:h-145.5 md:h-90  h-40.5 overflow-hidden bg-ds-surface",
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
      </div>
      <div className="flex flex-1 flex-col justify-between gap-2 p-3 md:p-4">
        <div className="space-y-1">
          <h3 className="font-heading text-base md:text-xl font-medium tracking-[-0.02em] leading-tight text-ds-text">
            {piece.name}
          </h3>
          {piece.ownedSince ? (
            <p className="font-body text-xs font-normal tracking-[-0.02em] uppercase text-ds-text-secondary">
              Owned Since: {piece.ownedSince}
            </p>
          ) : null}
        </div>
        <p className="font-body text-xs font-semibold flex items-center justify-between tracking-[-0.02em] text-teal-800 group-hover:text-ds-secondary mt-auto pt-1">
          <span>Explore Piece</span>
          <span className="rtl:rotate-180 inline-block">→</span>
        </p>
      </div>
    </>
  );

  const sharedClasses = cn(
    "group flex flex-col h-full md:max-h-[729px] max-h-[268px] overflow-hidden border border-ds-border bg-ds-background transition-colors duration-200 hover:border-ds-secondary",
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
