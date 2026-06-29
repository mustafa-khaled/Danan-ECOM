import Link from "next/link";
import { StatusPill } from "@dadan/ui";
import { fetchClients, fetchOrders, fetchPieces, fetchTransfers } from "../../../lib/api";
import { getAdminCookieHeader } from "../../../lib/session";

export default async function DashboardPage() {
  const cookieHeader = await getAdminCookieHeader();

  const [clients, pieces, orders, reviewTransfers] = await Promise.all([
    fetchClients(1, 1, cookieHeader),
    fetchPieces(1, 1, cookieHeader),
    fetchOrders(1, 1, cookieHeader),
    fetchTransfers(1, 5, "DADAN_REVIEW", cookieHeader),
  ]);

  const stats = [
    { label: "Clients", value: clients.total, href: "/clients" },
    { label: "Pieces", value: pieces.total, href: "/pieces" },
    { label: "Orders", value: orders.total, href: "/orders" },
    {
      label: "Pending review",
      value: reviewTransfers.total,
      href: "/transfers",
      highlight: reviewTransfers.total > 0,
    },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl tracking-[0.06em] uppercase">Overview</h1>
        <p className="mt-2 text-sm text-[var(--color-ivory-muted)]">
          Platform snapshot and transfers awaiting DADAN review.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={[
              "rounded-[var(--radius-panel)] border bg-[var(--color-surface)] p-6 transition-colors hover:border-[var(--color-gold)]",
              stat.highlight
                ? "border-[var(--color-warning)]/60"
                : "border-[var(--color-border)]",
            ].join(" ")}
          >
            <p className="text-xs tracking-[0.14em] uppercase text-[var(--color-ivory-muted)]">
              {stat.label}
            </p>
            <p className="mt-3 font-display text-4xl tracking-[0.04em]">{stat.value}</p>
          </Link>
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl tracking-[0.06em] uppercase">
            Transfers in review
          </h2>
          <Link
            href="/transfers"
            className="text-xs tracking-[0.12em] uppercase text-[var(--color-gold)] hover:underline"
          >
            View all
          </Link>
        </div>

        {reviewTransfers.items.length === 0 ? (
          <p className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-8 text-sm text-[var(--color-ivory-muted)]">
            No transfers currently require DADAN review.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)] rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            {reviewTransfers.items.map((transfer) => (
              <li
                key={transfer.id}
                className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-display text-lg tracking-[0.04em]">
                    {transfer.piece.serialNumber}
                  </p>
                  <p className="text-sm text-[var(--color-ivory-muted)]">
                    {transfer.piece.design.name} · {transfer.fromClient.displayName} →{" "}
                    {transfer.toClient.displayName}
                  </p>
                </div>
                <StatusPill status="DADAN REVIEW" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
