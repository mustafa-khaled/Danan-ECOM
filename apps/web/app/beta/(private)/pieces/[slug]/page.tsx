import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { StatusPill } from "@/components/ui";
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

export default async function DesignDetailPage({ params }: DesignDetailPageProps) {
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
    <>
      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <div className="relative aspect-[4/5] overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
            {design.imageUrls[0] ? (
              <Image
                src={design.imageUrls[0]}
                alt={design.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center font-display text-4xl text-[var(--color-text-muted)]">
                DADAN
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div>
            <p className="text-xs tracking-[0.16em] uppercase text-[var(--color-text-muted)]">
              {design.collection.name}
            </p>
            <h1 className="mt-2 font-english text-4xl text-[var(--color-text)]">{design.name}</h1>
            <p className="mt-4 font-english text-2xl text-[var(--color-text)]">
              {formatPrice(design.basePrice, design.currency, locale)}
            </p>
          </div>

          {design.availablePieces.length > 0 ? (
            <StatusPill status="AVAILABLE" />
          ) : (
            <StatusPill status="Not Available" />
          )}

          {design.story ? (
            <p className="text-lg leading-relaxed text-[var(--color-text-muted)]">{design.story}</p>
          ) : null}

          <div>
            <h2 className="font-english text-xl text-[var(--color-text)]">{t("specs")}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <SpecRow label={t("gold")} value={design.material} />
              <SpecRow label={t("weight")} value={`${design.weight} g`} />
              <SpecRow label="Dimensions" value={design.dimensions} />
              {design.specifications.map((spec) => (
                <SpecRow key={spec.key} label={spec.key} value={spec.value} />
              ))}
            </dl>
          </div>

          {design.availablePieces.length > 0 && firstAvailable ? (
            <DesignActions
              pieceId={firstAvailable.id}
              initialSaved={savedIds.has(firstAvailable.id)}
            />
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              No pieces are currently available for this design.
            </p>
          )}
        </section>
      </div>

      {design.story ? (
        <section className="mt-16 border-t border-[var(--color-border)] pt-16">
          <h2 className="font-english text-2xl text-[var(--color-text)]">{t("storyOfProtection")}</h2>
          <p className="mt-4 max-w-2xl text-[var(--color-text-muted)]">{design.story}</p>
        </section>
      ) : null}
    </>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--color-border)] pb-2">
      <dt className="tracking-[0.08em] uppercase text-[var(--color-text-muted)]">{label}</dt>
      <dd className="text-[var(--color-text)]">{value}</dd>
    </div>
  );
}
