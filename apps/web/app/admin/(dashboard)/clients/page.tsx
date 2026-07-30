import Link from "next/link";
import { StatusPill, LuxuryButton } from "@/components/ui";
import { AdminPagination } from "@/components/admin-pagination";
import { AdminSearch } from "@/components/admin-search";
import { fetchAdminClients } from "@/features/admin";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ADMIN_PAGE_SIZE, parseAdminPage } from "@/shared/lib/parse-admin-page";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q } = await searchParams;
  const page = parseAdminPage(pageParam);
  const cookieHeader = await getAdminCookieHeader();
  const { items, total } = await fetchAdminClients(page, ADMIN_PAGE_SIZE, cookieHeader, q);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-[0.06em] uppercase">Clients</h1>
          <p className="mt-2 text-sm text-[var(--color-ivory-muted)]">
            {total} registered {total === 1 ? "client" : "clients"}
          </p>
        </div>
        <Link href="/admin/clients/new">
          <LuxuryButton size="sm">Create Client</LuxuryButton>
        </Link>
      </div>

      <AdminSearch placeholder="Search clients by name or email..." />

      <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">Registered clients</caption>
          <thead className="border-b border-[var(--color-border)] text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]">
            <tr>
              <th className="px-4 py-3 font-normal">Name</th>
              <th className="px-4 py-3 font-normal">Email</th>
              <th className="px-4 py-3 font-normal">Key prefix</th>
              <th className="px-4 py-3 font-normal">Pieces</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {items.map((client) => (
              <tr key={client.id}>
                <td className="px-4 py-4 font-display tracking-[0.04em]">{client.displayName}</td>
                <td className="px-4 py-4 text-[var(--color-ivory-muted)]">{client.email}</td>
                <td className="px-4 py-4 font-mono text-xs">{client.houseKeyPrefix}</td>
                <td className="px-4 py-4">{client.pieceCount}</td>
                <td className="px-4 py-4">
                  <StatusPill status={client.isActive ? "ACTIVE" : "INACTIVE"} />
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="text-xs uppercase tracking-[0.1em] text-[var(--color-accent)] hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-ivory-muted)]">
                  {q ? `No clients matching "${q}".` : "No clients registered yet. Create your first client to get started."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        basePath="/admin/clients"
        page={page}
        limit={ADMIN_PAGE_SIZE}
        total={total}
      />
    </div>
  );
}
