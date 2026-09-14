import { fetchAdminClients } from "@/features/admin/api/fetch-admin-clients";
import { fetchAdminClientStats } from "@/features/admin/api/fetch-admin-stats";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { parseAdminPage, ADMIN_PAGE_SIZE } from "@/shared/lib/parse-admin-page";
import {
  CollectionAccessFilter,
  CollectionAccessTable,
} from "@/features/admin";
import type { AdminClientListItem } from "@/features/admin/types";


interface CollectionAccessPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function CollectionAccessPage({
  params,
  searchParams,
}: CollectionAccessPageProps) {
  const { id } = await params;
  const { page: pageParam, q } = await searchParams;
  const page = parseAdminPage(pageParam);
  const cookieHeader = await getAdminCookieHeader();

  let items: AdminClientListItem[] = [];
  let total = 0;
  let stats = [{ id: 1, title: "Total Members", count: 0 }];

  try {
    const [res, clientStats] = await Promise.all([
      fetchAdminClients(page, ADMIN_PAGE_SIZE, cookieHeader, {
        q,
        collectionId: id,
      }),
      fetchAdminClientStats(cookieHeader),
    ]);
    items = res.items;
    total = res.total;
    stats = [
      { id: 1, title: "Total Members", count: clientStats.total },
      ...clientStats.byClass.slice(0, 3).map((cls, index) => ({
        id: index + 2,
        title: cls.name,
        count: cls.count,
      })),
    ];
  } catch {
    items = [];
    total = 0;
  }

  return (
    <div className="space-y-6 pb-[32px]">
      <div className="grid grid-cols-4 gap-5 py-[32px]">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="h-28 flex flex-col items-start justify-center gap-3 bg-[#FBF7F7] p-6 rounded-xl"
          >
            <h6 className="font-heading text-[#353D48] font-bold text-h5 leading-[100%]">
              {stat.title}
            </h6>
            <p className="font-semibold text-h6">{stat.count}</p>
          </div>
        ))}
      </div>

      <CollectionAccessFilter collectionId={id} />
      <CollectionAccessTable items={items} total={total} />
    </div>
  );
}
