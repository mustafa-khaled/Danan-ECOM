import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { DesignActions } from "./design-actions";
import { WardrobeActions } from "./wardrobe-actions";
import { formatPrice } from "@/shared/utils/format";
import type { DesignDetail } from "@/features/pieces";

interface WardrobeInfo {
  pieceId: string;
  serialNumber: string;
  status: string;
  activeTransfer?: { id: string };
}

interface PieceDetailsProps {
  design: DesignDetail;
  isWardrobe?: boolean;
  wardrobeInfo?: WardrobeInfo;
}

export default async function PieceDetails({
  design,
  isWardrobe,
  wardrobeInfo,
}: PieceDetailsProps) {
  const t = await getTranslations("piece");
  const locale = (await getLocale()) as Locale;

  const firstAvailable = design.availablePieces?.[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left: Main Product Image */}
      <div className="relative aspect-4/5 w-full overflow-hidden rounded-lg">
        {design.imageUrls[0] ? (
          <Image
            src={design.imageUrls[0]}
            alt={design.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-ds-surface font-heading text-4xl text-ds-text-muted">
            DADAN
          </div>
        )}
      </div>

      {/* Right: Product Details */}
      <div className="w-full bg-ds-background px-4 py-8 sm:px-8 lg:px-10 lg:py-10 flex flex-col justify-center rounded-lg border border-ds-border-light">
        <section className="space-y-5">
          {/* Title & Collection Subtitle */}
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl lg:text-[32px] font-bold leading-tight text-ds-text">
              {design.name}
            </h1>
            <p className="mt-2.5 font-body text-sm sm:text-base font-medium text-ds-text-secondary">
              {t("partOfCollection", { collection: design.collection.name })}
            </p>
          </div>

          {/* Story / Description */}
          {design.story ? (
            <div className="space-y-1">
              <p className="text-xs sm:text-sm text-ds-text-muted font-body">
                {t("partOfCollection", {
                  collection: design.collection.name,
                })}
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-ds-text-secondary font-body">
                {design.story}
              </p>
            </div>
          ) : null}

          {/* Specs Bullet List */}
          <ul className="space-y-3 sm:space-y-3.5 text-sm sm:text-base font-body">
            <SpecRow label={t("material")} value={design.material} />
            {design.specifications.map((spec) => (
              <SpecRow key={spec.key} label={spec.key} value={spec.value} />
            ))}
            <SpecRow label={t("weight")} value={`${design.weight}g`} />
            <SpecRow label={t("origin")} value="Crafted in Saudi Arabia" />
          </ul>

          {/* Divider */}
          <hr className="border-t border-ds-border" />

          {/* Become Part of the Story + Price */}
          <div>
            <p className="font-body text-sm sm:text-base font-semibold text-ds-text">
              {t("becomePartOfStory")}
            </p>
            <p className="mt-1.5 font-body text-lg sm:text-xl font-bold text-ds-text">
              {formatPrice(design.basePrice, design.currency, locale)}
            </p>
          </div>

          {/* Action Buttons */}
          <div>
            {isWardrobe && wardrobeInfo ? (
              <WardrobeActions
                pieceId={wardrobeInfo.pieceId}
                pieceName={design.name}
                serialNumber={wardrobeInfo.serialNumber}
                status={wardrobeInfo.status}
                activeTransfer={wardrobeInfo.activeTransfer}
              />
            ) : (design.availablePieces?.length ?? 0) > 0 && firstAvailable ? (
              <DesignActions
                pieceId={firstAvailable.id}
                initialSaved={firstAvailable.isSaved}
              />
            ) : (
              <p className="text-sm text-ds-text-muted font-body">
                No pieces are currently available for this design.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-baseline gap-2 text-ds-text">
      <span className="text-ds-text-muted font-bold">•</span>
      <span className="font-bold text-ds-text">{label}:</span>
      <span className="font-normal text-ds-text-secondary">{value}</span>
    </li>
  );
}
