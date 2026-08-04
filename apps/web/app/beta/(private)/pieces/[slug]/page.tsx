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

  console.log("first", design);

  return (
    <div className="grid lg:grid-cols-2 gap-x-10">
      {/* ── Section 1: Main image + Product details ── */}

      {/* Left: Main product image — full-bleed on mobile */}
      <div className="relative h-108 lg:h-225 w-full overflow-hidden bg-(--color-surface)">
        {design.imageUrls[0] ? (
          <Image
            src={design.imageUrls[0]}
            alt={design.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-4xl text-(--color-text-muted)">
            DADAN
          </div>
        )}
      </div>

      {/* Right: Product details — container padding on mobile only */}
      <section className="px-4 lg:px-0 py-6 lg:py-0 space-y-6">
        {/* Title & collection */}
        <div>
          <h1 className="font-display text-2xl lg:text-[32px] font-bold leading-tight text-(--color-text)">
            {design.name}
          </h1>
          <p className="mt-3 font-display text-sm lg:text-base font-semibold italic text-(--color-text)">
            {t("partOfCollection", { collection: design.collection.name })}
          </p>
        </div>

        {/* Description */}
        {design.story ? (
          <div className="space-y-1">
            <p className="text-xs lg:text-sm text-(--color-text-muted)">
              {t("partOfCollection", { collection: design.collection.name })}
            </p>
            <p className="text-xs lg:text-sm leading-relaxed text-(--color-text-muted)">
              {design.story}
            </p>
          </div>
        ) : null}

        {/* Divider */}
        <hr className="border-border" />

        {/* Specs as bullet list */}
        <ul className="space-y-4 text-sm lg:text-base">
          <SpecRow label={t("material")} value={design.material} />
          {design.specifications.map((spec) => (
            <SpecRow key={spec.key} label={spec.key} value={spec.value} />
          ))}
          <SpecRow label={t("weight")} value={`${design.weight}g`} />
          <SpecRow label={t("origin")} value="Crafted in Saudi Arabia" />
        </ul>

        {/* Become Part of the Story + Price */}
        <div className="pt-2">
          <p className="font-display text-sm lg:text-base font-semibold text-(--color-text)">
            {t("becomePartOfStory")}
          </p>
          <p className="mt-1 text-base lg:text-lg font-medium text-(--color-text)">
            {formatPrice(design.basePrice, design.currency, locale)}
          </p>
        </div>

        {/* Action buttons */}
        {design.availablePieces.length > 0 && firstAvailable ? (
          <DesignActions
            pieceId={firstAvailable.id}
            initialSaved={savedIds.has(firstAvailable.id)}
          />
        ) : (
          <p className="text-sm text-(--color-text-muted)">
            No pieces are currently available for this design.
          </p>
        )}
      </section>

      {/* ── Section 2: Secondary images + Story ── */}

      {/* Left: Secondary images */}
      {design.imageUrls.length > 1 && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {design.imageUrls.slice(1).map((url, i) => (
            <div
              key={i}
              className="relative h-55 lg:h-152.5 w-full overflow-hidden bg-(--color-surface)"
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

      {/* Right: Story section */}
      {design.story ? (
        <section className="px-4 lg:px-0 mt-2 py-6 lg:py-8 border-t border-border lg:border-t-0 space-y-4">
          <h2 className="font-display text-xl lg:text-2xl font-bold text-(--color-text)">
            {t("storyOfProtection")}
          </h2>
          <p className="font-display text-sm lg:text-base font-semibold italic text-(--color-text)">
            {t("partOfCollection", { collection: design.collection.name })}
          </p>
          <div className="space-y-4 text-sm lg:text-base leading-relaxed text-(--color-text-muted)">
            {design.story.split("\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-baseline gap-2">
      <span className="text-(--color-text-muted)">•</span>
      <span className="font-semibold text-(--color-text)">{label}:</span>
      <span className="text-(--color-text)">{value}</span>
    </li>
  );
}
