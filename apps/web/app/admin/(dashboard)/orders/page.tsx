import { StatusPill } from "@dadan/ui";
import { fetchOrders } from "../../../../lib/api/admin";
import { getAdminCookieHeader } from "../../../../lib/session/admin";

function formatAmount(amount: string | number, currency: string) {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function OrdersPage() {
  const cookieHeader = await getAdminCookieHeader();
  const { items, total } = await fetchOrders(1, 50, cookieHeader);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-[0.06em] uppercase">Orders</h1>
        <p className="mt-2 text-sm text-[var(--color-ivory-muted)]">
          {total} {total === 1 ? "order" : "orders"}
        </p>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]">
            <tr>
              <th className="px-4 py-3 font-normal">Client</th>
              <th className="px-4 py-3 font-normal">Items</th>
              <th className="px-4 py-3 font-normal">Total</th>
              <th className="px-4 py-3 font-normal">Placed</th>
              <th className="px-4 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {items.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-4">
                  <p>{order.client.displayName}</p>
                  <p className="text-xs text-[var(--color-ivory-muted)]">{order.client.email}</p>
                </td>
                <td className="px-4 py-4">
                  {order.items.map((item) => item.piece.serialNumber).join(", ")}
                </td>
                <td className="px-4 py-4">
                  {formatAmount(order.totalAmount, order.currency)}
                </td>
                <td className="px-4 py-4 text-[var(--color-ivory-muted)]">
                  {new Date(order.placedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-4">
                  <StatusPill status={order.status.replace(/_/g, " ")} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
