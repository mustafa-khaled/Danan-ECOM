import Link from "next/link";
import { SerialBadge, StatusPill, LuxuryButton } from "@/components/ui";
import { AdminPagination } from "@/components/admin-pagination";
import { AdminSearch } from "@/components/admin-search";
import { fetchAdminPieces } from "@/features/admin";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ADMIN_PAGE_SIZE, parseAdminPage } from "@/shared/lib/parse-admin-page";

export default async function PiecesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q } = await searchParams;
  const page = parseAdminPage(pageParam);
  const cookieHeader = await getAdminCookieHeader();
  const { items, total } = await fetchAdminPieces(page, ADMIN_PAGE_SIZE, cookieHeader, q);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-[0.06em] uppercase">Pieces</h1>
          <p className="mt-2 text-sm text-[var(--color-ivory-muted)]">
            {total} registered {total === 1 ? "piece" : "pieces"}
          </p>
        </div>
        <Link href="/admin/pieces/new">
          <LuxuryButton size="sm">Register Piece</LuxuryButton>
        </Link>
      </div>

      <AdminSearch placeholder="Search pieces by serial number..." />

      <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">Registered jewelry pieces</caption>
          <thead className="border-b border-[var(--color-border)] text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]">
            <tr>
              <th className="px-4 py-3 font-normal">Serial</th>
              <th className="px-4 py-3 font-normal">Design</th>
              <th className="px-4 py-3 font-normal">Collection</th>
              <th className="px-4 py-3 font-normal">Owner</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {items.map((piece) => (
              <tr key={piece.id}>
                <td className="px-4 py-4">
                  <SerialBadge serial={piece.serialNumber} />
                </td>
                <td className="px-4 py-4">{piece.designName}</td>
                <td className="px-4 py-4 text-[var(--color-ivory-muted)]">{piece.collection}</td>
                <td className="px-4 py-4">{piece.currentOwner ?? "—"}</td>
                <td className="px-4 py-4">
                  <StatusPill status={piece.status.replace(/_/g, " ")} />
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/admin/pieces/${piece.id}`}
                    className="text-xs uppercase tracking-[0.1em] text-[var(--color-accent)] hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-ivory-muted)]">
                  No pieces registered yet. Register your first piece to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        basePath="/admin/pieces"
        page={page}
        limit={ADMIN_PAGE_SIZE}
        total={total}
      />
    </div>
  );
}
