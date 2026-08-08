import Image from "next/image";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { SectionHead, SerialBadge } from "@/components/ui";
import { CartItemActions } from "@/components/cart-item-actions";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { fetchCart } from "@/features/cart";
import { formatPrice } from "@/shared/utils/format";
import { getSessionCookieHeader } from "@/features/auth/server/session";
import type { Locale } from "@/i18n/routing";
import Container from "@/components/ui/container";

export default async function CartPage() {
  const cookie = await getSessionCookieHeader();
  const { items, summary } = await fetchCart(cookie);
  const t = await getTranslations("cart");
  const locale = (await getLocale()) as Locale;

  const validItems = items.filter((item) => item.piece);

  return (
    <Container className="pt-2">
      <SectionHead title={t("title")} />

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
                  className="flex flex-col gap-4 border border-border bg-white p-4 sm:flex-row sm:items-center"
                >
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-(--color-surface)">
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
                    <p className="text-xs tracking-[0.12em] uppercase text-(--color-text-muted)">
                      {piece.design.collection.name}
                    </p>
                    <h2 className="font-english text-xl text-(--color-text)">
                      {piece.design.name}
                    </h2>
                    <div className="mt-2">
                      <SerialBadge serial={piece.serialNumber} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="font-english text-lg text-(--color-text)">
                      {formatPrice(
                        piece.design.basePrice,
                        piece.design.currency,
                        locale,
                      )}
                    </p>
                    <CartItemActions pieceId={piece.id} />
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="h-fit border border-border bg-(--color-surface) p-6">
            <h2 className="font-english text-xl text-(--color-text)">
              {t("total")}
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-(--color-text-muted)">{t("subtotal")}</dt>
                <dd>
                  {formatPrice(summary.subtotal, summary.currency, locale)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-(--color-text-muted)">{t("vat")}</dt>
                <dd>
                  {formatPrice(summary.vatAmount, summary.currency, locale)}
                </dd>
              </div>
              <div className="flex justify-between font-english text-lg text-(--color-text)">
                <dt>{t("total")}</dt>
                <dd>{formatPrice(summary.total, summary.currency, locale)}</dd>
              </div>
            </dl>
            <Link
              href="/beta/checkout"
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center bg-(--color-accent) text-sm tracking-widest uppercase text-white transition-opacity hover:opacity-90"
            >
              {t("checkout")}
            </Link>
          </aside>
        </div>
      )}
    </Container>
  );
}
