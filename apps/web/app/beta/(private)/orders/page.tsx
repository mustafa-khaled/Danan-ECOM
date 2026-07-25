import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { ClientShell, StatusPill } from "@/components/ui";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { fetchOrders } from "@/features/orders";
import { formatPrice } from "@/shared/utils/format";
import { getSessionCookieHeader, requireClientSession } from "@/features/auth/server/session";
import type { Locale } from "@/i18n/routing";

export default async function OrdersPage() {
  const profile = await requireClientSession();
  const cookie = await getSessionCookieHeader();
  const { items: orders } = await fetchOrders(cookie);
  const t = await getTranslations("orders");
  const locale = (await getLocale()) as Locale;

  return (
    <ClientShell displayName={profile.displayName}>
      <header className="mb-10 space-y-3">
        <h1 className="font-english text-4xl text-[var(--color-text)]">{t("title")}</h1>
      </header>

      {orders.length === 0 ? (
        <EmptyState
          title={t("empty")}
          description={t("emptyDescription")}
          action={{ href: "/beta/collections", label: t("title") }}
        />
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/beta/orders/${order.id}`}
                className="block border border-[var(--color-border)] bg-white p-6 transition-colors hover:border-[var(--color-accent)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs text-[var(--color-text-muted)]">
                      {order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="mt-2 font-english text-xl text-[var(--color-text)]">
                      {order.items.length} piece{order.items.length === 1 ? "" : "s"}
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      {new Date(order.placedAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-SA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-end">
                    <StatusPill status={order.status} />
                    <p className="mt-3 font-english text-lg text-[var(--color-text)]">
                      {formatPrice(order.totalAmount, order.currency, locale)}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ClientShell>
  );
}
