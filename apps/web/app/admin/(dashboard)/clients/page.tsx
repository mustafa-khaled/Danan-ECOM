import { StatusPill } from "@dadan/ui";
import { fetchClients } from "../../../../lib/api/admin";
import { getAdminCookieHeader } from "../../../../lib/session/admin";

export default async function ClientsPage() {
  const cookieHeader = await getAdminCookieHeader();
  const { items, total } = await fetchClients(1, 50, cookieHeader);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-[0.06em] uppercase">Clients</h1>
        <p className="mt-2 text-sm text-[var(--color-ivory-muted)]">
          {total} registered {total === 1 ? "client" : "clients"}
        </p>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]">
            <tr>
              <th className="px-4 py-3 font-normal">Name</th>
              <th className="px-4 py-3 font-normal">Email</th>
              <th className="px-4 py-3 font-normal">Key prefix</th>
              <th className="px-4 py-3 font-normal">Pieces</th>
              <th className="px-4 py-3 font-normal">Status</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
