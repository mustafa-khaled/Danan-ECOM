import Link from "next/link";
import { PrivateLayout, StatusPill } from "@/components/ui";
import { EmptyState } from "../../../../components/empty-state";
import { fetchOrders } from "@/features/orders";
import { formatPrice } from "@/shared/utils/format";
import { privateNavItems } from "@/shared/lib/nav";
import { getSessionCookieHeader, requireClientSession } from "@/features/auth/server/session";

export default async function OrdersPage() {
  const profile = await requireClientSession();
  const cookie = await getSessionCookieHeader();
  const { items: orders } = await fetchOrders(cookie);

  return (
    <PrivateLayout clientName={profile.displayName} navItems={privateNavItems}>
      <header className="mb-10 space-y-3">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--color-gold-light)]">History</p>
        <h1 className="font-display text-4xl text-[var(--color-ivory)]">Orders</h1>
        <p className="text-[var(--color-ivory-muted)]">Your purchase history and order status.</p>
      </header>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Completed purchases will appear here with full details."
          action={{ href: "/beta/collections", label: "Browse Collections" }}
        />
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/beta/orders/${order.id}`}
                className="block rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-colors hover:border-[var(--color-gold)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs text-[var(--color-ivory-muted)]">
                      {order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="mt-2 font-display text-xl text-[var(--color-ivory)]">
                      {order.items.length} piece{order.items.length === 1 ? "" : "s"}
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-ivory-muted)]">
                      {new Date(order.placedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-end">
                    <StatusPill status={order.status} />
                    <p className="mt-3 font-display text-lg text-[var(--color-gold-light)]">
                      {formatPrice(order.totalAmount, order.currency)}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PrivateLayout>
  );
}
