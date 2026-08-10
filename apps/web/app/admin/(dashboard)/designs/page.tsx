import Link from "next/link";
import { StatusPill, Button } from "@/components/ui";
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
          <h1 className="font-heading text-3xl font-bold tracking-tight text-ds-text">Designs</h1>
          <p className="mt-2 text-sm text-ds-text-secondary font-body">
            {total} design{total === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/admin/designs/new">
          <Button size="sm" variant="primary">Create Design</Button>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-ds-border bg-ds-background">
        <table className="min-w-full text-left text-sm font-body">
          <thead className="border-b border-ds-border text-xs tracking-wider uppercase text-ds-text-secondary bg-ds-surface">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Collection</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Images</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ds-border">
            {items.map((design) => (
              <tr key={design.id} className="hover:bg-ds-surface/50 transition-colors">
                <td className="px-4 py-4">
                  <p className="font-semibold text-ds-text">{design.name}</p>
                  <p className="text-xs text-ds-text-muted">
                    {design.nameAr}
                  </p>
                </td>
                <td className="px-4 py-4 text-ds-text-secondary">
                  {design.collectionName ?? design.collectionId}
                </td>
                <td className="px-4 py-4 text-ds-text font-medium">
                  {design.basePrice} {design.currency}
                </td>
                <td className="px-4 py-4 text-center text-ds-text">
                  {design.imageUrls?.length ?? 0}
                </td>
                <td className="px-4 py-4">
                  <StatusPill
                    status={design.isActive ? "Active" : "Inactive"}
                  />
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/admin/designs/${design.id}`}
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
