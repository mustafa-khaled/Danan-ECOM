import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { DesignActions } from "./design-actions";
import { WardrobeActions } from "./wardrobe-actions";
import { formatPrice } from "@/shared/utils/format";
import type { DesignDetail } from "@/features/pieces";
import { Container } from "./ui";
import { cn } from "@/lib/utils";

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
    <div className="flex flex-col gap-[16px] xl:flex-row xl:h-225 h-258.5">
      {/* Left: Main Product Image */}
      <div className="relative w-full xl:h-auto h-108 overflow-hidden">
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
      <Container
        className={cn(
          "xl:pt-6 xl:px-[16px] xl:pb-10.5 py-5",
          isWardrobe ? "px-0" : "",
        )}
      >
        <section>
          {/* Title & Collection Subtitle */}
          <div className="xl:mb-[32px] xl:pb-0 pb-[16px]">
            <h1 className="font-heading font-bold lg:leading-15.75 xl:text-h1 text-h4 text-neutral-900">
              {design.name}
            </h1>
            <p className="my-[16px] xl:text-h3 text-h6 font-semibold text-neutral-800">
              {t("partOfCollection", { collection: design.collection.name })}
            </p>

            {/* Story / Description */}
            {design.story ? (
              <p className="xl:text-h5 text-[14px] text-neutral-800 font-medium">
                {design.story}
              </p>
            ) : null}
          </div>

          {/* Specs Bullet List */}
          <ul className="xl:py-[32px] py-[16px] border-y border-neutral-200 xl:space-y-6 space-y-3">
            <SpecRow label={t("material")} value={design.material} />
            {design.specifications.map((spec) => (
              <SpecRow key={spec.key} label={spec.key} value={spec.value} />
            ))}
            <SpecRow label={t("weight")} value={`${design.weight}g`} />
            <SpecRow label={t("origin")} value="Crafted in Saudi Arabia" />
          </ul>

          {/* Action Buttons */}
          <div className="xl:pt-12 pt-[16px]">
            <div className="xl:text-h3 text-h6 font-bold text-neutral-800 xl:mb-[32px] mb-[16px]">
              <p>{t("becomePartOfStory")}</p>
              <p>{formatPrice(design.basePrice, design.currency, locale)}</p>
            </div>

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
      </Container>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-baseline gap-2 text-ds-text xl:text-h3 text-h6">
      <span className="text-neutral-800 font-bold">•</span>
      <span className="font-bold text-neutral-800">{label}:</span>
      <span className="font-medium text-ds-text-secondary">{value}</span>
    </li>
  );
}
