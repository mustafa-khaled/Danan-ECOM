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
}

export function PieceCard({ piece, className = "", onSelect }: PieceCardProps) {
  const content = (
    <>
      <div className="aspect-[4/5] overflow-hidden bg-[var(--color-void)]">
        {piece.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={piece.imageUrl}
            alt={piece.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--color-ivory-muted)]">
            <span className="font-display text-lg">DADAN</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 p-4">
        {piece.collectionName ? (
          <p className="text-xs tracking-[0.14em] uppercase text-[var(--color-ivory-muted)]">
            {piece.collectionName}
          </p>
        ) : null}
        <h3 className="font-display text-xl leading-tight text-[var(--color-ivory)]">
          {piece.name}
        </h3>
        {piece.price ? (
          <p className="font-display text-sm tracking-[0.08em] text-[var(--color-gold-light)]">
            {piece.price}
          </p>
        ) : null}
        <SerialBadge serial={piece.serialNumber} />
      </div>
    </>
  );

  const sharedClasses = [
    "group block overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-luxury)] transition-colors duration-200 hover:border-[var(--color-gold)]",
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
