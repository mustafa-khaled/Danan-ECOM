import Link from "next/link";
import { StatusPill } from "@/components/ui";
import { AdminPagination } from "@/components/admin-pagination";
import { fetchAdminTransfers } from "@/features/admin";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ADMIN_PAGE_SIZE, parseAdminPage } from "@/shared/lib/parse-admin-page";

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

export default async function TransfersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parseAdminPage(pageParam);
  const cookieHeader = await getAdminCookieHeader();
  const { items, total } = await fetchAdminTransfers(
    page,
    ADMIN_PAGE_SIZE,
    undefined,
    cookieHeader,
  );

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
              <th className="px-4 py-3 font-normal">Actions</th>
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
                    <Link
                      href={`/admin/transfers/${transfer.id}`}
                      className="hover:text-[var(--color-accent)]"
                    >
                      <p className="font-display tracking-[0.04em]">{transfer.piece.serialNumber}</p>
                      <p className="text-xs text-[var(--color-ivory-muted)]">
                        {transfer.piece.design.name}
                      </p>
                    </Link>
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
                      className={
                        isReview
                          ? "border-[var(--color-warning)]/60 text-[var(--color-warning)]"
                          : ""
                      }
                    />
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/admin/transfers/${transfer.id}`}
                      className="text-xs uppercase tracking-[0.1em] text-[var(--color-accent)] hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AdminPagination
        basePath="/admin/transfers"
        page={page}
        limit={ADMIN_PAGE_SIZE}
        total={total}
      />
    </div>
  );
}
