import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { DesignActions } from "@/components/design-actions";
import { ApiError } from "@/shared/lib/send-request";
import { fetchDesign } from "@/features/pieces";
import { fetchSaved } from "@/features/saved";
import { formatPrice } from "@/shared/utils/format";
import { getSessionCookieHeader } from "@/features/auth/server/session";
import type { Locale } from "@/i18n/routing";

interface DesignDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function DesignDetailPage({
  params,
}: DesignDetailPageProps) {
  const { slug } = await params;
  const cookie = await getSessionCookieHeader();
  const t = await getTranslations("piece");
  const locale = (await getLocale()) as Locale;

  let design;
  try {
    design = await fetchDesign(slug, cookie);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const saved = await fetchSaved(cookie);
  const savedIds = new Set(saved.map((s) => s.piece.id));
  const firstAvailable = design.availablePieces[0];

  return (
    <div className="w-full">
      {/* ── Section 1: Main Product Hero + Details Container ── */}
      <div className="grid lg:grid-cols-2 lg:items-stretch">
        {/* Left: Main Product Image */}
        <div className="relative h-112 sm:h-136 lg:h-auto lg:min-h-170 xl:min-h-190 w-full overflow-hidden bg-[#0D1514]">
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
            <div className="flex h-full items-center justify-center font-display text-4xl text-[#555555]">
              DADAN
            </div>
          )}
        </div>

        {/* Right: Product Details Container (Container box on mobile screen) */}
        <div className="w-full bg-white px-6 py-8 sm:px-8 lg:px-12 lg:py-10 xl:px-16 xl:py-12 flex flex-col justify-between">
          <section className="space-y-6">
            {/* Title & Collection Subtitle */}
            <div>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-[34px] font-bold leading-tight text-[#2D2321]">
                {design.name}
              </h1>
              <p className="mt-3 font-sans text-sm sm:text-base font-medium text-[#2D2321]">
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

            {/* Divider Line 1 */}
            <hr className="border-t border-gray-200/80 my-5 sm:my-6" />

            {/* Specs Bullet List */}
            <ul className="space-y-3 sm:space-y-3.5 my-5 sm:my-6 text-sm sm:text-base">
              <SpecRow label={t("material")} value={design.material} />
              {design.specifications.map((spec) => (
                <SpecRow key={spec.key} label={spec.key} value={spec.value} />
              ))}
              <SpecRow label={t("weight")} value={`${design.weight}g`} />
              <SpecRow label={t("origin")} value="Crafted in Saudi Arabia" />
            </ul>

            {/* Divider Line 2 */}
            <hr className="border-t border-gray-200/80 my-5 sm:my-6" />

            {/* Become Part of the Story + Price */}
            <div className="pt-1">
              <p className="font-sans text-sm sm:text-base font-semibold text-[#2D2321]">
                {t("becomePartOfStory")}
              </p>
              <p className="mt-1.5 font-sans text-lg sm:text-xl font-bold text-[#2D2321]">
                {formatPrice(design.basePrice, design.currency, locale)}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              {design.availablePieces.length > 0 && firstAvailable ? (
                <DesignActions
                  pieceId={firstAvailable.id}
                  initialSaved={savedIds.has(firstAvailable.id)}
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

      {/* ── Section 2: Secondary images + Extended Story (if present) ── */}
      {/* {(design.imageUrls.length > 1 || design.story) && (
        <div className="grid lg:grid-cols-2 gap-x-10 mt-8 border-t border-gray-200 pt-8 px-6 sm:px-8 lg:px-12">
          {design.imageUrls.length > 1 && (
            <div className="grid grid-cols-2 gap-3">
              {design.imageUrls.slice(1).map((url, i) => (
                <div
                  key={i}
                  className="relative h-56 lg:h-96 w-full overflow-hidden bg-[#0D1514] rounded-[2px]"
                >
                  <Image
                    src={url}
                    alt={`${design.name} - ${i + 2}`}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {design.story ? (
            <section className="py-6 lg:py-0 space-y-4">
              <h2 className="font-display text-xl lg:text-2xl font-bold text-[#2D2321]">
                {t("storyOfProtection")}
              </h2>
              <p className="font-sans text-sm sm:text-base font-medium text-[#2D2321]">
                {t("partOfCollection", { collection: design.collection.name })}
              </p>
              <div className="space-y-3 text-sm sm:text-base leading-relaxed text-gray-600">
                {design.story.split("\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )} */}
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
