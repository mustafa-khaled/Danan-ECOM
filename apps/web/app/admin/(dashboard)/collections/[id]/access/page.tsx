import { fetchAdminClients } from "@/features/admin/api/fetch-admin-clients";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { parseAdminPage, ADMIN_PAGE_SIZE } from "@/shared/lib/parse-admin-page";
import {
  CollectionAccessFilter,
  CollectionAccessTable,
} from "@/features/admin";
import type { AdminClientListItem } from "@/features/admin/types";

const stats = [
  {
    id: 1,
    title: "Total Members",
    count: 1238,
  },
  {
    id: 2,
    title: "Class A",
    count: 124,
  },
  {
    id: 3,
    title: "Class B",
    count: 542,
  },
  {
    id: 4,
    title: "Class C",
    count: 582,
  },
] as const;

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

  try {
    const res = await fetchAdminClients(page, ADMIN_PAGE_SIZE, cookieHeader, q);
    items = res.items;
    total = res.total;
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
