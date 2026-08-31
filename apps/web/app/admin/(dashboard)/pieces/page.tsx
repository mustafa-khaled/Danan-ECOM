import Link from "next/link";
import { SerialBadge, StatusPill, Button } from "@/components/ui";
import { AdminPagination } from "@/components/admin/layout/admin-pagination";
import { AdminSearch } from "@/components/admin/layout/admin-search";
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
  const { items, total } = await fetchAdminPieces(
    page,
    ADMIN_PAGE_SIZE,
    cookieHeader,
    q,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-ds-text">
            Pieces
          </h1>
          <p className="mt-2 text-sm text-ds-text-secondary font-body">
            {total} registered {total === 1 ? "piece" : "pieces"}
          </p>
        </div>
        <Link href="/admin/pieces/new">
          <Button size="sm" variant="primary">
            Register Piece
          </Button>
        </Link>
      </div>

      <AdminSearch placeholder="Search pieces by serial number..." />

      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-ds-border bg-ds-background">
        <table className="min-w-full text-left text-sm font-body">
          <caption className="sr-only">Registered jewelry pieces</caption>
          <thead className="border-b border-ds-border text-xs tracking-wider uppercase text-ds-text-secondary bg-ds-surface">
            <tr>
              <th className="px-4 py-3 font-semibold">Serial</th>
              <th className="px-4 py-3 font-semibold">Design</th>
              <th className="px-4 py-3 font-semibold">Collection</th>
              <th className="px-4 py-3 font-semibold">Owner</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ds-border">
            {items.map((piece) => (
              <tr
                key={piece.id}
                className="hover:bg-ds-surface/50 transition-colors"
              >
                <td className="px-4 py-4">
                  <SerialBadge serial={piece.serialNumber} />
                </td>
                <td className="px-4 py-4 text-ds-text font-medium">
                  {piece.designName}
                </td>
                <td className="px-4 py-4 text-ds-text-secondary">
                  {piece.collection}
                </td>
                <td className="px-4 py-4 text-ds-text">
                  {piece.currentOwner ?? "—"}
                </td>
                <td className="px-4 py-4">
                  <StatusPill status={piece.status.replace(/_/g, " ")} />
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/admin/pieces/${piece.id}`}
                    className="text-xs uppercase tracking-wider font-semibold text-ds-primary hover:underline"
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
                  className="px-4 py-8 text-center text-ds-text-muted"
                >
                  No pieces registered yet. Register your first piece to get
                  started.
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
