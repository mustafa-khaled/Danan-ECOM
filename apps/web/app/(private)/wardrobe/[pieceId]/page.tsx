import Link from "next/link";
import { notFound } from "next/navigation";
import { GoldDivider, PrivateLayout, SerialBadge, StatusPill } from "@dadan/ui";
import { CertificateViewer } from "../../../../components/certificate-viewer";
import { ApiError, fetchWardrobePiece } from "../../../../lib/api";
import { privateNavItems } from "../../../../lib/nav";
import { getSessionCookieHeader, requireClientSession } from "../../../../lib/session";

interface WardrobePiecePageProps {
  params: Promise<{ pieceId: string }>;
}

export default async function WardrobePiecePage({ params }: WardrobePiecePageProps) {
  const { pieceId } = await params;
  const profile = await requireClientSession();
  const cookie = await getSessionCookieHeader();

  let piece: Record<string, unknown>;
  try {
    piece = await fetchWardrobePiece(pieceId, cookie);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const design = piece.design as {
    name: string;
    imageUrls: string[];
    material: string;
    weight: number;
    dimensions: string;
    collection: { name: string; slug: string };
    specifications: Array<{ key: string; value: string }>;
  };

  return (
    <PrivateLayout clientName={profile.displayName} navItems={privateNavItems}>
      <nav aria-label="Breadcrumb" className="mb-6 text-xs tracking-[0.12em] uppercase">
        <ol className="flex flex-wrap items-center gap-2 text-[var(--color-ivory-muted)]">
          <li>
            <Link href="/wardrobe" className="hover:text-[var(--color-gold-light)]">
              Wardrobe
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-[var(--color-ivory)]">{design.name}</li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="aspect-[4/5] overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-void)]">
          {design.imageUrls[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={design.imageUrls[0]}
              alt={design.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-4xl text-[var(--color-ivory-muted)]">
              DADAN
            </div>
          )}
        </div>

        <section className="space-y-6">
          <div>
            <p className="text-xs tracking-[0.16em] uppercase text-[var(--color-ivory-muted)]">
              {design.collection.name}
            </p>
            <h1 className="mt-2 font-display text-4xl text-[var(--color-ivory)]">{design.name}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <SerialBadge serial={String(piece.serialNumber)} />
              <StatusPill status={String(piece.status)} />
            </div>
          </div>

          <CertificateViewer
            pieceId={pieceId}
            pieceName={design.name}
            serialNumber={String(piece.serialNumber)}
          />

          <GoldDivider />

          <div>
            <h2 className="font-display text-xl text-[var(--color-ivory)]">Specifications</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <SpecRow label="Material" value={design.material} />
              <SpecRow label="Weight" value={`${design.weight} g`} />
              <SpecRow label="Dimensions" value={design.dimensions} />
              {design.specifications?.map((spec) => (
                <SpecRow key={spec.key} label={spec.key} value={spec.value} />
              ))}
            </dl>
          </div>

          {Array.isArray(piece.ownershipHistory) && piece.ownershipHistory.length > 0 ? (
            <div>
              <h2 className="font-display text-xl text-[var(--color-ivory)]">Ownership History</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--color-ivory-muted)]">
                {(piece.ownershipHistory as Array<{ acquiredAt: string; acquisitionType: string }>).map(
                  (record, index) => (
                    <li key={index}>
                      {new Date(record.acquiredAt).toLocaleDateString()} — {record.acquisitionType}
                    </li>
                  ),
                )}
              </ul>
            </div>
          ) : null}
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
