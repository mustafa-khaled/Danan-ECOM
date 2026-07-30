import { notFound } from "next/navigation";
import Link from "next/link";
import { SerialBadge, StatusPill } from "@/components/ui";
import { fetchAdminOrderDetail } from "@/features/admin/api/fetch-admin-orders";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ApiError } from "@/shared/lib/send-request";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatAmount(amount: string | number, currency: string) {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const cookieHeader = await getAdminCookieHeader();

  let order;
  try {
    order = await fetchAdminOrderDetail(id, cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-[0.06em] uppercase">Order Detail</h1>
          <p className="mt-2 text-sm text-[var(--color-ivory-muted)]">
            Order #{id.slice(0, 8)}
          </p>
        </div>
        <StatusPill status={order.status.replace(/_/g, " ")} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="mb-4 font-display text-lg tracking-[0.06em] uppercase text-[var(--color-ivory-muted)]">
            Client
          </h2>
          <p className="text-lg">{order.client.displayName}</p>
          <p className="text-sm text-[var(--color-ivory-muted)]">{order.client.email}</p>
        </div>

        <div className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="mb-4 font-display text-lg tracking-[0.06em] uppercase text-[var(--color-ivory-muted)]">
            Summary
          </h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-[var(--color-ivory-muted)]">Total</dt>
              <dd className="mt-1 text-lg">{formatAmount(order.totalAmount, order.currency)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-[var(--color-ivory-muted)]">Placed</dt>
              <dd className="mt-1">{new Date(order.placedAt).toLocaleDateString()}</dd>
            </div>
            {order.completedAt && (
              <div>
                <dt className="text-xs uppercase tracking-[0.1em] text-[var(--color-ivory-muted)]">Completed</dt>
                <dd className="mt-1">{new Date(order.completedAt).toLocaleDateString()}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="mb-4 font-display text-lg tracking-[0.06em] uppercase text-[var(--color-ivory-muted)]">
          Items
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <caption className="sr-only">Order items</caption>
            <thead className="border-b border-[var(--color-border)] text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]">
              <tr>
                <th className="px-4 py-3 font-normal">Serial</th>
                <th className="px-4 py-3 font-normal">Design</th>
                <th className="px-4 py-3 font-normal">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-4">
                    <SerialBadge serial={item.piece.serialNumber} />
                  </td>
                  <td className="px-4 py-4">{item.piece.design.name}</td>
                  <td className="px-4 py-4">{formatAmount(item.priceAtPurchase, order.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {order.shippingAddress && (
        <div className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="mb-4 font-display text-lg tracking-[0.06em] uppercase text-[var(--color-ivory-muted)]">
            Shipping Address
          </h2>
          <p className="whitespace-pre-line text-sm">{order.shippingAddress}</p>
        </div>
      )}

      <div>
        <Link
          href="/admin/orders"
          className="text-xs uppercase tracking-[0.1em] text-[var(--color-accent)] hover:underline"
        >
          &larr; Back to Orders
        </Link>
      </div>
    </div>
  );
}
