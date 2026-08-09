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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
      {/* Left: Main Product Image */}
      <div className="relative aspect-4/5 w-full overflow-hidden">
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
          <div className="flex h-full items-center justify-center bg-[#0D1514] font-display text-4xl text-[#555555]">
            DADAN
          </div>
        )}
      </div>

      {/* Right: Product Details */}
      <div className="w-full bg-white px-2 py-8 sm:px-8 lg:px-10 lg:py-10 flex flex-col justify-center">
        <section className="space-y-5">
          {/* Title & Collection Subtitle */}
          <div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-[32px] font-bold leading-tight text-[#2D2321]">
              {design.name}
            </h1>
            <p className="mt-2.5 font-sans text-sm sm:text-base font-medium text-[#2D2321]">
              {t("partOfCollection", { collection: design.collection.name })}
            </p>
          </div>

          {/* Story / Description */}
          {design.story ? (
            <div className="space-y-1">
              <p className="text-xs sm:text-sm text-gray-500">
                {t("partOfCollection", {
                  collection: design.collection.name,
                })}
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-gray-500">
                {design.story}
              </p>
            </div>
          ) : null}

          {/* Specs Bullet List */}
          <ul className="space-y-3 sm:space-y-3.5 text-sm sm:text-base">
            <SpecRow label={t("material")} value={design.material} />
            {design.specifications.map((spec) => (
              <SpecRow key={spec.key} label={spec.key} value={spec.value} />
            ))}
            <SpecRow label={t("weight")} value={`${design.weight}g`} />
            <SpecRow label={t("origin")} value="Crafted in Saudi Arabia" />
          </ul>

          {/* Divider */}
          <hr className="border-t border-gray-200/80" />

          {/* Become Part of the Story + Price */}
          <div>
            <p className="font-sans text-sm sm:text-base font-semibold text-[#2D2321]">
              {t("becomePartOfStory")}
            </p>
            <p className="mt-1.5 font-sans text-lg sm:text-xl font-bold text-[#2D2321]">
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
              <p className="text-sm text-gray-500">
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
    <li className="flex items-baseline gap-2 text-[#2D2321]">
      <span className="text-gray-400 font-bold">•</span>
      <span className="font-bold text-[#2D2321]">{label}:</span>
      <span className="font-normal text-[#374151]">{value}</span>
    </li>
  );
}
