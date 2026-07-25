import Image from "next/image";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { ClientShell, SerialBadge } from "@/components/ui";
import { CartItemActions } from "@/components/cart-item-actions";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { fetchCart } from "@/features/cart";
import { formatPrice } from "@/shared/utils/format";
import { calculateTotal, calculateVat } from "@/shared/lib/pricing";
import { getSessionCookieHeader, requireClientSession } from "@/features/auth/server/session";
import type { Locale } from "@/i18n/routing";

export default async function CartPage() {
  const profile = await requireClientSession();
  const cookie = await getSessionCookieHeader();
  const items = await fetchCart(cookie);
  const t = await getTranslations("cart");
  const locale = (await getLocale()) as Locale;

  const validItems = items.filter((item) => item.piece);
  const subtotal = validItems.reduce(
    (sum, item) => sum + parseFloat(item.piece!.design.basePrice),
    0,
  );
  const currency = validItems[0]?.piece?.design.currency ?? "SAR";
  const vat = calculateVat(subtotal);
  const total = calculateTotal(subtotal);

  return (
    <ClientShell displayName={profile.displayName}>
      <header className="mb-10 space-y-3">
        <h1 className="font-english text-4xl text-[var(--color-text)]">{t("title")}</h1>
      </header>

      {validItems.length === 0 ? (
        <EmptyState
          title={t("empty")}
          description={t("emptyDescription")}
          action={{ href: "/beta/collections", label: t("checkout") }}
        />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <ul className="space-y-4">
            {validItems.map((item) => {
              const piece = item.piece!;
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-4 border border-[var(--color-border)] bg-white p-4 sm:flex-row sm:items-center"
                >
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-[var(--color-surface)]">
                    {piece.design.imageUrls[0] ? (
                      <Image
                        src={piece.design.imageUrls[0]}
                        alt={piece.design.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs tracking-[0.12em] uppercase text-[var(--color-text-muted)]">
                      {piece.design.collection.name}
                    </p>
                    <h2 className="font-english text-xl text-[var(--color-text)]">
                      {piece.design.name}
                    </h2>
                    <div className="mt-2">
                      <SerialBadge serial={piece.serialNumber} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="font-english text-lg text-[var(--color-text)]">
                      {formatPrice(piece.design.basePrice, piece.design.currency, locale)}
                    </p>
                    <CartItemActions pieceId={piece.id} />
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="h-fit border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="font-english text-xl text-[var(--color-text)]">{t("total")}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-muted)]">{t("subtotal")}</dt>
                <dd>{formatPrice(subtotal, currency, locale)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-muted)]">{t("vat")}</dt>
                <dd>{formatPrice(vat, currency, locale)}</dd>
              </div>
              <div className="flex justify-between font-english text-lg text-[var(--color-text)]">
                <dt>{t("total")}</dt>
                <dd>{formatPrice(total, currency, locale)}</dd>
              </div>
            </dl>
            <Link
              href="/beta/checkout"
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center bg-[var(--color-accent)] text-sm tracking-[0.1em] uppercase text-white transition-opacity hover:opacity-90"
            >
              {t("checkout")}
            </Link>
          </aside>
        </div>
      )}
    </ClientShell>
  );
}
