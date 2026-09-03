import {
  CollectionsStats,
  CollectionsTableFilter,
  CollectionTable,
} from "@/features/admin";
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
    <>
      <div className="bg-white h-15 px-7.5 flex items-center font-bold text-h5 text-neutral-800">
        Curate the stories, pieces, and experiences that belong to the House
      </div>

      <div className="px-7.5 py-6.75">
        <div className="bg-white rounded-3xl p-6 space-y-6">
          <CollectionsStats />

          <div className="space-y-4">
            <CollectionsTableFilter />
            <CollectionTable items={items} total={total} />
          </div>
        </div>
      </div>
    </>
  );
}
