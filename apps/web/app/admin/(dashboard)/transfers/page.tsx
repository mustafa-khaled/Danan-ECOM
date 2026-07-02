import { StatusPill } from "@dadan/ui";
import { fetchTransfers } from "../../../../lib/api/admin";
import { getAdminCookieHeader } from "../../../../lib/session/admin";

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

export default async function TransfersPage() {
  const cookieHeader = await getAdminCookieHeader();
  const { items, total } = await fetchTransfers(1, 50, undefined, cookieHeader);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-[0.06em] uppercase">Transfers</h1>
        <p className="mt-2 text-sm text-[var(--color-ivory-muted)]">
          {total} transfer {total === 1 ? "request" : "requests"} · DADAN review items highlighted
        </p>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]">
            <tr>
              <th className="px-4 py-3 font-normal">Serial</th>
              <th className="px-4 py-3 font-normal">Sender</th>
              <th className="px-4 py-3 font-normal">Recipient</th>
              <th className="px-4 py-3 font-normal">Type</th>
              <th className="px-4 py-3 font-normal">Initiated</th>
              <th className="px-4 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {items.map((transfer) => {
              const isReview = transfer.status === "DADAN_REVIEW" || transfer.needsReview;

              return (
                <tr
                  key={transfer.id}
                  className={
                    isReview
                      ? "bg-[var(--color-warning)]/10 outline -outline-offset-1 outline-[var(--color-warning)]/40"
                      : undefined
                  }
                >
                  <td className="px-4 py-4">
                    <p className="font-display tracking-[0.04em]">{transfer.piece.serialNumber}</p>
                    <p className="text-xs text-[var(--color-ivory-muted)]">
                      {transfer.piece.design.name}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p>{transfer.fromClient.displayName}</p>
                    <p className="text-xs text-[var(--color-ivory-muted)]">
                      {transfer.fromClient.email}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p>{transfer.toClient.displayName}</p>
                    <p className="text-xs text-[var(--color-ivory-muted)]">
                      {transfer.toClient.email}
                    </p>
                  </td>
                  <td className="px-4 py-4">{transfer.transferType.replace(/_/g, " ")}</td>
                  <td className="px-4 py-4 text-[var(--color-ivory-muted)]">
                    {new Date(transfer.initiatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill
                      status={isReview ? "DADAN REVIEW" : formatStatus(transfer.status)}
                      className={isReview ? "border-[var(--color-warning)]/60 text-[var(--color-warning)]" : ""}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
