import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GoldDivider, PrivateLayout, SerialBadge, StatusPill } from "@dadan/ui";
import { DesignActions } from "../../../../../components/design-actions";
import { ApiError, fetchDesign, fetchSaved } from "../../../../../lib/api";
import { formatPrice, privateNavItems } from "../../../../../lib/nav";
import { getSessionCookieHeader, requireClientSession } from "../../../../../lib/session";

interface DesignDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function DesignDetailPage({ params }: DesignDetailPageProps) {
  const { slug } = await params;
  const profile = await requireClientSession();
  const cookie = await getSessionCookieHeader();

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
    <PrivateLayout clientName={profile.displayName} navItems={privateNavItems}>
      <nav aria-label="Breadcrumb" className="mb-6 text-xs tracking-[0.12em] uppercase">
        <ol className="flex flex-wrap items-center gap-2 text-[var(--color-ivory-muted)]">
          <li>
            <Link href="/beta/home" className="hover:text-[var(--color-gold-light)]">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/beta/collections" className="hover:text-[var(--color-gold-light)]">
              Collections
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/beta/collections/${design.collection.slug}`}
              className="hover:text-[var(--color-gold-light)]"
            >
              {design.collection.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-[var(--color-ivory)]">{design.name}</li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-void)]">
            {design.imageUrls[0] ? (
              <Image
                src={design.imageUrls[0]}
                alt={design.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center font-display text-4xl text-[var(--color-ivory-muted)]">
                DADAN
              </div>
            )}
          </div>
          {design.imageUrls.length > 1 ? (
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {design.imageUrls.slice(1, 5).map((url, i) => (
                <Image
                  key={url}
                  src={url}
                  alt={`${design.name} thumbnail ${i + 1}`}
                  width={64}
                  height={80}
                  className="shrink-0 rounded-[var(--radius-item)] border border-[var(--color-border)] object-cover"
                />
              ))}
            </div>
          ) : null}
        </section>

        <section className="space-y-6">
          <div>
            <p className="text-xs tracking-[0.16em] uppercase text-[var(--color-ivory-muted)]">
              {design.collection.name}
            </p>
            <h1 className="mt-2 font-display text-4xl text-[var(--color-ivory)]">{design.name}</h1>
            <p className="mt-4 font-display text-2xl text-[var(--color-gold-light)]">
              {formatPrice(design.basePrice, design.currency)}
            </p>
          </div>

          {design.availablePieces.length > 0 ? (
            <StatusPill status="AVAILABLE" />
          ) : (
            <StatusPill status="Not Available" />
          )}

          {design.story ? (
            <p className="font-serif text-lg italic leading-relaxed text-[var(--color-ivory-muted)]">
              {design.story}
            </p>
          ) : null}

          <GoldDivider />

          <div>
            <h2 className="font-display text-xl text-[var(--color-ivory)]">Specifications</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <SpecRow label="Material" value={design.material} />
              <SpecRow label="Weight" value={`${design.weight} g`} />
              <SpecRow label="Dimensions" value={design.dimensions} />
              {design.specifications.map((spec) => (
                <SpecRow key={spec.key} label={spec.key} value={spec.value} />
              ))}
            </dl>
          </div>

          {design.availablePieces.length > 0 ? (
            <div className="space-y-4">
              <h2 className="font-display text-xl text-[var(--color-ivory)]">Available Pieces</h2>
              <ul className="space-y-2">
                {design.availablePieces.map((piece) => (
                  <li
                    key={piece.id}
                    className="flex items-center justify-between rounded-[var(--radius-item)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
                  >
                    <SerialBadge serial={piece.serialNumber} />
                    <StatusPill status={piece.status} />
                  </li>
                ))}
              </ul>
              {firstAvailable ? (
                <DesignActions
                  pieceId={firstAvailable.id}
                  initialSaved={savedIds.has(firstAvailable.id)}
                />
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-ivory-muted)]">
              No pieces are currently available for this design.
            </p>
          )}
        </section>
      </div>
    </PrivateLayout>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--color-border)] pb-2">
      <dt className="tracking-[0.08em] uppercase text-[var(--color-ivory-muted)]">{label}</dt>
      <dd className="text-[var(--color-ivory)]">{value}</dd>
    </div>
  );
}
