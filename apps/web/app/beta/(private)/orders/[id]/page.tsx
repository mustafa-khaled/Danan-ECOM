import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GoldDivider, PrivateLayout, SerialBadge, StatusPill } from "@/components/ui";
import { ApiError } from "@/shared/lib/send-request";
import { fetchOrder } from "@/features/orders";
import { formatPrice } from "@/shared/utils/format";
import { privateNavItems } from "@/shared/lib/nav";
import { getSessionCookieHeader, requireClientSession } from "@/features/auth/server/session";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const profile = await requireClientSession();
  const cookie = await getSessionCookieHeader();

  let order;
  try {
    order = await fetchOrder(id, cookie);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const address = order.shippingAddress;

  return (
    <PrivateLayout clientName={profile.displayName} navItems={privateNavItems}>
      <nav aria-label="Breadcrumb" className="mb-6 text-xs tracking-[0.12em] uppercase">
        <ol className="flex flex-wrap items-center gap-2 text-[var(--color-ivory-muted)]">
          <li>
            <Link href="/beta/orders" className="hover:text-[var(--color-gold-light)]">
              Orders
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-[var(--color-ivory)]">{order.id.slice(0, 8).toUpperCase()}</li>
        </ol>
      </nav>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-[var(--color-ivory)]">Order Details</h1>
          <p className="mt-2 text-sm text-[var(--color-ivory-muted)]">
            Placed {new Date(order.placedAt).toLocaleString()}
          </p>
        </div>
        <StatusPill status={order.status} />
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="font-display text-xl text-[var(--color-ivory)]">Items</h2>
          <GoldDivider className="my-4" />
          <ul className="space-y-4">
            {order.items.map((item) => (
              <li key={item.piece.id} className="flex gap-4">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-[var(--radius-item)] bg-[var(--color-void)]">
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
                  <p className="font-display text-lg text-[var(--color-ivory)]">{item.design.name}</p>
                  <div className="mt-2">
                    <SerialBadge serial={item.piece.serialNumber} />
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-gold-light)]">
                    {formatPrice(item.priceAtPurchase, order.currency)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <GoldDivider className="my-4" />
          <p className="font-display text-xl text-[var(--color-gold-light)]">
            Total: {formatPrice(order.totalAmount, order.currency)}
          </p>
        </section>

        <section className="space-y-6">
          <div className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="font-display text-xl text-[var(--color-ivory)]">Shipping</h2>
            <GoldDivider className="my-4" />
            <address className="not-italic text-sm leading-relaxed text-[var(--color-ivory-muted)]">
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

          <div className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="font-display text-xl text-[var(--color-ivory)]">Payment</h2>
            <GoldDivider className="my-4" />
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--color-ivory-muted)]">Provider</dt>
                <dd>{order.paymentProvider}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ivory-muted)]">Reference</dt>
                <dd className="font-mono text-xs">{order.paymentReference}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </PrivateLayout>
  );
}
