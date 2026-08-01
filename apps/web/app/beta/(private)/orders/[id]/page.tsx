import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { SerialBadge, StatusPill } from "@/components/ui";
import { ApiError } from "@/shared/lib/send-request";
import { fetchOrder } from "@/features/orders";
import { formatPrice } from "@/shared/utils/format";
import { getSessionCookieHeader } from "@/features/auth/server/session";
import type { Locale } from "@/i18n/routing";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const cookie = await getSessionCookieHeader();
  const locale = (await getLocale()) as Locale;

  let order;
  try {
    order = await fetchOrder(id, cookie);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const address = order.shippingAddress;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-6 text-xs tracking-[0.12em] uppercase">
        <ol className="flex flex-wrap items-center gap-2 text-[var(--color-text-muted)]">
          <li>
            <Link href="/beta/orders" className="hover:text-[var(--color-accent)]">
              Orders
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-[var(--color-text)]">{order.id.slice(0, 8).toUpperCase()}</li>
        </ol>
      </nav>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-english text-4xl text-[var(--color-text)]">Order Details</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Placed {new Date(order.placedAt).toLocaleString()}
          </p>
        </div>
        <StatusPill status={order.status} />
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="border border-[var(--color-border)] bg-white p-6">
          <h2 className="font-english text-xl text-[var(--color-text)]">Items</h2>
          <ul className="mt-4 space-y-4">
            {order.items.map((item) => (
              <li key={item.piece.id} className="flex gap-4">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-[var(--color-surface)]">
                  {item.design.imageUrls[0] ? (
                    <Image
                      src={item.design.imageUrls[0]}
                      alt={item.design.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div>
                  <p className="font-english text-lg text-[var(--color-text)]">{item.design.name}</p>
                  <div className="mt-2">
                    <SerialBadge serial={item.piece.serialNumber} />
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-text)]">
                    {formatPrice(item.priceAtPurchase, order.currency, locale)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 font-english text-xl text-[var(--color-text)]">
            Total: {formatPrice(order.totalAmount, order.currency, locale)}
          </p>
        </section>

        <section className="space-y-6">
          <div className="border border-[var(--color-border)] bg-white p-6">
            <h2 className="font-english text-xl text-[var(--color-text)]">Shipping</h2>
            <address className="mt-4 not-italic text-sm leading-relaxed text-[var(--color-text-muted)]">
              {address.fullName}
              <br />
              {address.line1}
              {address.line2 ? (
                <>
                  <br />
                  {address.line2}
                </>
              ) : null}
              <br />
              {address.city}, {address.region} {address.postalCode}
              <br />
              {address.country}
              <br />
              {address.phone}
            </address>
          </div>

          <div className="border border-[var(--color-border)] bg-white p-6">
            <h2 className="font-english text-xl text-[var(--color-text)]">Payment</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-muted)]">Provider</dt>
                <dd>{order.paymentProvider}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-muted)]">Reference</dt>
                <dd className="font-mono text-xs">{order.paymentReference}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </>
  );
}
