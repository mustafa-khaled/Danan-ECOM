import Link from "next/link";
import { StatusPill, Button } from "@/components/ui";
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
          <h1 className="font-heading text-3xl font-bold tracking-tight text-ds-text">Clients</h1>
          <p className="mt-2 text-sm text-ds-text-secondary font-body">
            {total} registered {total === 1 ? "client" : "clients"}
          </p>
        </div>
        <Link href="/admin/clients/new">
          <Button size="sm" variant="primary">Create Client</Button>
        </Link>
      </div>

      <AdminSearch placeholder="Search clients by name or email..." />

      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-ds-border bg-ds-background">
        <table className="min-w-full text-left text-sm font-body">
          <caption className="sr-only">Registered clients</caption>
          <thead className="border-b border-ds-border text-xs tracking-wider uppercase text-ds-text-secondary bg-ds-surface">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Key prefix</th>
              <th className="px-4 py-3 font-semibold">Pieces</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ds-border">
            {items.map((client) => (
              <tr key={client.id} className="hover:bg-ds-surface/50 transition-colors">
                <td className="px-4 py-4 font-semibold text-ds-text">{client.displayName}</td>
                <td className="px-4 py-4 text-ds-text-secondary">{client.email}</td>
                <td className="px-4 py-4 font-mono text-xs text-ds-text">{client.houseKeyPrefix}</td>
                <td className="px-4 py-4 text-ds-text">{client.pieceCount}</td>
                <td className="px-4 py-4">
                  <StatusPill status={client.isActive ? "ACTIVE" : "INACTIVE"} />
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="text-xs uppercase tracking-wider font-semibold text-ds-primary hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ds-text-muted">
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
