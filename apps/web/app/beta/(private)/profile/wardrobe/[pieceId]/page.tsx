import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SerialBadge, StatusPill } from "@/components/ui";
import { CertificateViewer } from "@/components/certificate-viewer";
import { TransferInitiate } from "@/components/transfer-initiate";
import { ApiError } from "@/shared/lib/send-request";
import { fetchWardrobePiece } from "@/features/wardrobe";
import { getSessionCookieHeader } from "@/features/auth/server/session";

interface WardrobePiecePageProps {
  params: Promise<{ pieceId: string }>;
}

export default async function WardrobePiecePage({
  params,
}: WardrobePiecePageProps) {
  const { pieceId } = await params;
  const cookie = await getSessionCookieHeader();
  const t = await getTranslations("wardrobe");

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
    <>
      <nav
        aria-label="Breadcrumb"
        className="mb-6 text-xs tracking-[0.12em] uppercase"
      >
        <ol className="flex flex-wrap items-center gap-2 text-(--color-text-muted)">
          <li>
            <Link
              href="/beta/profile/wardrobe"
              className="hover:text-(--color-accent)"
            >
              {t("title")}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-(--color-text)">{design.name}</li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="relative aspect-4/5 overflow-hidden border border-border bg-(--color-surface)">
          {design.imageUrls[0] ? (
            <Image
              src={design.imageUrls[0]}
              alt={design.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-4xl text-(--color-text-muted)">
              DADAN
            </div>
          )}
        </div>

        <section className="space-y-6">
          <div>
            <p className="text-xs tracking-[0.16em] uppercase text-(--color-text-muted)">
              {design.collection.name}
            </p>
            <h1 className="mt-2 font-english text-4xl text-(--color-text)">
              {design.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <SerialBadge serial={String(piece.serialNumber)} />
              <StatusPill status={String(piece.status)} />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {piece.status === "OWNED" && !piece.activeTransfer ? (
              <TransferInitiate
                pieceId={pieceId}
                pieceName={design.name}
                serialNumber={String(piece.serialNumber)}
              />
            ) : null}
            <CertificateViewer
              pieceId={pieceId}
              pieceName={design.name}
              serialNumber={String(piece.serialNumber)}
            />
            <Link
              href="/beta/verify"
              className="inline-flex min-h-11 items-center justify-center border border-(--color-accent) px-6 text-sm tracking-widest uppercase text-(--color-accent) transition-colors hover:bg-(--color-accent) hover:text-white"
            >
              {t("verifyAuthenticity")}
            </Link>
          </div>

          {piece.activeTransfer ? (
            <p className="text-sm text-(--color-text-muted)">
              A transfer is in progress.{" "}
              <Link
                href={`/beta/transfers/${(piece.activeTransfer as { id: string }).id}`}
                className="text-(--color-accent) underline-offset-4 hover:underline"
              >
                View transfer
              </Link>
            </p>
          ) : null}

          <div>
            <h2 className="font-english text-xl text-(--color-text)">
              {t("specs")}
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <SpecRow label="Material" value={design.material} />
              <SpecRow label="Weight" value={`${design.weight} g`} />
              <SpecRow label="Dimensions" value={design.dimensions} />
              {design.specifications?.map((spec) => (
                <SpecRow key={spec.key} label={spec.key} value={spec.value} />
              ))}
            </dl>
          </div>
        </section>
      </div>
    </>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2">
      <dt className="tracking-[0.08em] uppercase text-(--color-text-muted)">
        {label}
      </dt>
      <dd className="text-(--color-text)">{value}</dd>
    </div>
  );
}
