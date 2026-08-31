import { StatusPill } from "@/components/ui";
import { AdminPagination } from "@/components/admin/layout/admin-pagination";
import { fetchAdminVerificationLogs } from "@/features/admin/api/fetch-admin-verification-logs";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ADMIN_PAGE_SIZE, parseAdminPage } from "@/shared/lib/parse-admin-page";

export default async function VerificationLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parseAdminPage(pageParam);
  const cookieHeader = await getAdminCookieHeader();
  const { items, total } = await fetchAdminVerificationLogs(
    page,
    ADMIN_PAGE_SIZE,
    cookieHeader,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-[0.06em] uppercase">
          Verification Logs
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ivory-muted)]">
          {total} verification {total === 1 ? "attempt" : "attempts"} recorded
        </p>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">Verification log entries</caption>
          <thead className="border-b border-[var(--color-border)] text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]">
            <tr>
              <th className="px-4 py-3 font-normal">Serial Number</th>
              <th className="px-4 py-3 font-normal">Result</th>
              <th className="px-4 py-3 font-normal">IP Address</th>
              <th className="px-4 py-3 font-normal">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {items.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-4 font-mono text-xs">
                  {log.serialNumber}
                </td>
                <td className="px-4 py-4">
                  <StatusPill
                    status={log.result}
                    className={
                      log.result === "FOUND"
                        ? "border-green-500/60 text-green-500"
                        : "border-red-500/60 text-red-500"
                    }
                  />
                </td>
                <td className="px-4 py-4 font-mono text-xs text-[var(--color-ivory-muted)]">
                  {log.ipAddress}
                </td>
                <td className="px-4 py-4 text-[var(--color-ivory-muted)]">
                  {new Date(log.verifiedAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-[var(--color-ivory-muted)]"
                >
                  No verification attempts recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        basePath="/admin/verification-logs"
        page={page}
        limit={ADMIN_PAGE_SIZE}
        total={total}
      />
    </div>
  );
}
