import Link from "next/link";
import { StatusPill, LuxuryButton } from "@/components/ui";
import { AdminPagination } from "@/components/admin-pagination";
import { fetchAdminCollections } from "@/features/admin/api/fetch-admin-collections";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ADMIN_PAGE_SIZE, parseAdminPage } from "@/shared/lib/parse-admin-page";

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parseAdminPage(pageParam);
  const cookieHeader = await getAdminCookieHeader();
  const { items, total } = await fetchAdminCollections(
    page,
    ADMIN_PAGE_SIZE,
    cookieHeader,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-[0.06em] uppercase">Collections</h1>
          <p className="mt-2 text-sm text-[var(--color-ivory-muted)]">
            {total} collection{total === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/admin/collections/new">
          <LuxuryButton size="sm">Create Collection</LuxuryButton>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]">
            <tr>
              <th className="px-4 py-3 font-normal">Name</th>
              <th className="px-4 py-3 font-normal">Slug</th>
              <th className="px-4 py-3 font-normal">Designs</th>
              <th className="px-4 py-3 font-normal">Sort Order</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {items.map((collection) => (
              <tr key={collection.id}>
                <td className="px-4 py-4">
                  <p className="font-display tracking-[0.04em]">{collection.name}</p>
                  <p className="text-xs text-[var(--color-ivory-muted)]">
                    {collection.nameAr}
                  </p>
                </td>
                <td className="px-4 py-4 text-[var(--color-ivory-muted)]">
                  {collection.slug}
                </td>
                <td className="px-4 py-4">
                  {collection.designCount} design{collection.designCount === 1 ? "" : "s"}
                </td>
                <td className="px-4 py-4 text-center">
                  {collection.sortOrder}
                </td>
                <td className="px-4 py-4">
                  <StatusPill
                    status={collection.isVisible ? "Visible" : "Hidden"}
                    className={
                      collection.isVisible
                        ? "border-green-500/60 text-green-500"
                        : "border-[var(--color-ivory-muted)]/60 text-[var(--color-ivory-muted)]"
                    }
                  />
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/admin/collections/${collection.id}`}
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
                  No collections yet. Create your first collection to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        basePath="/admin/collections"
        page={page}
        limit={ADMIN_PAGE_SIZE}
        total={total}
      />
    </div>
  );
}
