import {
  CollectionPiecesFilter,
  CollectionPiecesTable,
} from "@/features/admin";
import { fetchAdminPieces } from "@/features/admin/api/fetch-admin-pieces";
import { fetchAdminPieceStats } from "@/features/admin/api/fetch-admin-stats";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { parseAdminPage, ADMIN_PAGE_SIZE } from "@/shared/lib/parse-admin-page";
import type { AdminPieceListItem } from "@/features/admin/types";

export default async function AdminPiecesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q } = await searchParams;
  const page = parseAdminPage(pageParam);
  const cookieHeader = await getAdminCookieHeader();

  let items: AdminPieceListItem[] = [];
  let total = 0;
  let pieceStats = { total: 0, published: 0, drafts: 0, archived: 0 };

  try {
    const [piecesRes, statsRes] = await Promise.all([
      fetchAdminPieces(page, ADMIN_PAGE_SIZE, cookieHeader, undefined, undefined, q),
      fetchAdminPieceStats(undefined, cookieHeader),
    ]);
    items = piecesRes.items;
    total = piecesRes.total;
    pieceStats = statsRes;
  } catch {
    items = [];
    total = 0;
  }

  const stats = [
    { id: 1, title: "Pieces", count: pieceStats.total },
    { id: 2, title: "Published", count: pieceStats.published },
    { id: 3, title: "Drafts", count: pieceStats.drafts },
    { id: 4, title: "Archived", count: pieceStats.archived },
  ];

  return (
    <>
      <div className="bg-white h-15 px-7.5 flex items-center font-bold text-h5 text-neutral-800">
        House pieces across every collection
      </div>

      <div className="px-7.5 py-6.75">
        <div className="bg-white rounded-3xl p-6 space-y-6">
          <div className="grid grid-cols-4 gap-5 py-[32px] border-b border-[#E1E4E8]">
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
          <CollectionPiecesFilter />
          <CollectionPiecesTable items={items} total={total} />
        </div>
      </div>
    </>
  );
}
