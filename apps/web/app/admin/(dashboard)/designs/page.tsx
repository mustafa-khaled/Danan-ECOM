import Link from "next/link";
import { StatusPill, LuxuryButton } from "@/components/ui";
import { AdminPagination } from "@/components/admin-pagination";
import { fetchAdminDesigns } from "@/features/admin/api/fetch-admin-collections";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ADMIN_PAGE_SIZE, parseAdminPage } from "@/shared/lib/parse-admin-page";

export default async function DesignsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; collectionId?: string }>;
}) {
  const { page: pageParam, collectionId } = await searchParams;
  const page = parseAdminPage(pageParam);
  const cookieHeader = await getAdminCookieHeader();
  const { items, total } = await fetchAdminDesigns(
    page,
    ADMIN_PAGE_SIZE,
    collectionId,
    cookieHeader,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-[0.06em] uppercase">Designs</h1>
          <p className="mt-2 text-sm text-[var(--color-ivory-muted)]">
            {total} design{total === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/admin/designs/new">
          <LuxuryButton size="sm">Create Design</LuxuryButton>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]">
            <tr>
              <th className="px-4 py-3 font-normal">Name</th>
              <th className="px-4 py-3 font-normal">Collection</th>
              <th className="px-4 py-3 font-normal">Price</th>
              <th className="px-4 py-3 font-normal">Images</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {items.map((design) => (
              <tr key={design.id}>
                <td className="px-4 py-4">
                  <p className="font-display tracking-[0.04em]">{design.name}</p>
                  <p className="text-xs text-[var(--color-ivory-muted)]">
                    {design.nameAr}
                  </p>
                </td>
                <td className="px-4 py-4 text-[var(--color-ivory-muted)]">
                  {design.collectionName ?? design.collectionId}
                </td>
                <td className="px-4 py-4">
                  {design.basePrice} {design.currency}
                </td>
                <td className="px-4 py-4 text-center">
                  {design.imageUrls?.length ?? 0}
                </td>
                <td className="px-4 py-4">
                  <StatusPill
                    status={design.isActive ? "Active" : "Inactive"}
                    className={
                      design.isActive
                        ? "border-green-500/60 text-green-500"
                        : "border-[var(--color-ivory-muted)]/60 text-[var(--color-ivory-muted)]"
                    }
                  />
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/admin/designs/${design.id}`}
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
                  No designs yet. Create your first design to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        basePath="/admin/designs"
        page={page}
        limit={ADMIN_PAGE_SIZE}
        total={total}
      />
    </div>
  );
}
