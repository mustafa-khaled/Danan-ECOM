import Link from "next/link";
import { StatusPill } from "@/components/ui";
import { AdminPagination } from "@/components/admin/layout/admin-pagination";
import { AdminFilter } from "@/components/admin/layout/admin-filter";
import { fetchAdminOrders } from "@/features/admin";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ADMIN_PAGE_SIZE, parseAdminPage } from "@/shared/lib/parse-admin-page";

function formatAmount(amount: string | number, currency: string) {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { page: pageParam, status: statusFilter } = await searchParams;
  const page = parseAdminPage(pageParam);
  const cookieHeader = await getAdminCookieHeader();
  const { items, total } = await fetchAdminOrders(
    page,
    ADMIN_PAGE_SIZE,
    cookieHeader,
    statusFilter || undefined,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-[0.06em] uppercase">
          Orders
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ivory-muted)]">
          {total} {total === 1 ? "order" : "orders"}
        </p>
      </div>

      <AdminFilter
        paramName="status"
        label="Status"
        options={[
          { value: "PENDING", label: "Pending" },
          { value: "PAID", label: "Paid" },
          { value: "PROCESSING", label: "Processing" },
          { value: "COMPLETED", label: "Completed" },
          { value: "CANCELLED", label: "Cancelled" },
        ]}
      />

      <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">Client orders</caption>
          <thead className="border-b border-[var(--color-border)] text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]">
            <tr>
              <th className="px-4 py-3 font-normal">Client</th>
              <th className="px-4 py-3 font-normal">Items</th>
              <th className="px-4 py-3 font-normal">Total</th>
              <th className="px-4 py-3 font-normal">Placed</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {items.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-4">
                  <p>{order.client.displayName}</p>
                  <p className="text-xs text-[var(--color-ivory-muted)]">
                    {order.client.email}
                  </p>
                </td>
                <td className="px-4 py-4">
                  {order.items
                    .map((item) => item.piece.serialNumber)
                    .join(", ")}
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
                <td className="px-4 py-4">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-xs uppercase tracking-[0.1em] text-[var(--color-accent)] hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-[var(--color-ivory-muted)]"
                >
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        basePath="/admin/orders"
        page={page}
        limit={ADMIN_PAGE_SIZE}
        total={total}
      />
    </div>
  );
}
