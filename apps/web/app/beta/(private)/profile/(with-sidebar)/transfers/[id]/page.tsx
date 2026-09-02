import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SerialBadge, StatusPill } from "@/components/ui";
import { TransferActions } from "@/components/transfer-actions";
import { ApiError } from "@/shared/lib/send-request";
import { fetchTransfer } from "@/features/transfers";
import { formatTransferStatus } from "@/shared/utils/format";
import { getSessionCookieHeader, requireClientSession } from "@/features/auth/server/session";

interface TransferDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TransferDetailPage({ params }: TransferDetailPageProps) {
  const { id } = await params;
  const profile = await requireClientSession();
  const cookie = await getSessionCookieHeader();
  const t = await getTranslations("transfers");

  let transfer;
  try {
    transfer = await fetchTransfer(id, cookie);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const role =
    transfer.fromClientId === profile.id
      ? "sender"
      : transfer.toClientId === profile.id
        ? "recipient"
        : "none";

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-6 text-xs tracking-[0.12em] uppercase">
        <ol className="flex flex-wrap items-center gap-2 text-[var(--color-text-muted)]">
          <li>
            <Link href="/beta/profile/transfers" className="hover:text-[var(--color-accent)]">
              {t("backToList")}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-[var(--color-text)]">{transfer.id.slice(0, 8).toUpperCase()}</li>
        </ol>
      </nav>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-english text-4xl text-[var(--color-text)]">{t("details")}</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {t("initiated", { date: new Date(transfer.initiatedAt).toLocaleString() })}
          </p>
        </div>
        <StatusPill status={formatTransferStatus(transfer.status)} />
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="border border-[var(--color-border)] bg-white p-6">
          <h2 className="font-english text-xl text-[var(--color-text)]">{t("piece")}</h2>
          <div className="relative mt-4 aspect-[4/3] overflow-hidden bg-[var(--color-surface)]">
            {transfer.piece.design.imageUrls[0] ? (
              <Image
                src={transfer.piece.design.imageUrls[0]}
                alt={transfer.piece.design.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full min-h-48 items-center justify-center font-display text-2xl text-[var(--color-text-muted)]">
                DADAN
              </div>
            )}
          </div>
          <p className="mt-4 font-english text-2xl text-[var(--color-text)]">
            {transfer.piece.design.name}
          </p>
          <div className="mt-3">
            <SerialBadge serial={transfer.piece.serialNumber} />
          </div>
        </section>

        <section className="space-y-6">
          <div className="border border-[var(--color-border)] bg-white p-6">
            <h2 className="font-english text-xl text-[var(--color-text)]">{t("parties")}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-muted)]">{t("from")}</dt>
                <dd>{transfer.fromClient.displayName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-muted)]">{t("to")}</dt>
                <dd>{transfer.toClient.displayName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-muted)]">{t("transferType")}</dt>
                <dd>{transfer.transferType}</dd>
              </div>
            </dl>
          </div>

          <TransferActions transferId={transfer.id} status={transfer.status} role={role} />
        </section>
      </div>
    </>
  );
}
