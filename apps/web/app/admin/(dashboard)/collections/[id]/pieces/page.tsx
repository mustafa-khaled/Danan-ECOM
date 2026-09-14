import { notFound } from "next/navigation";
import { fetchAdminCollectionDetail } from "@/features/admin/api/fetch-admin-collections";
import { fetchAdminPieces } from "@/features/admin/api/fetch-admin-pieces";
import { fetchAdminPieceStats } from "@/features/admin/api/fetch-admin-stats";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ApiError } from "@/shared/lib/send-request";
import { parseAdminPage, ADMIN_PAGE_SIZE } from "@/shared/lib/parse-admin-page";
import {
  CollectionPiecesFilter,
  CollectionPiecesTable,
  RegisterPieceForm,
} from "@/features/admin";
import type { AdminPieceListItem } from "@/features/admin/types";


interface CollectionPiecesPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function CollectionPiecesPage({
  params,
  searchParams,
}: CollectionPiecesPageProps) {
  const { id } = await params;
  const { page: pageParam, q } = await searchParams;
  const page = parseAdminPage(pageParam);
  const cookieHeader = await getAdminCookieHeader();

  let collection;
  try {
    collection = await fetchAdminCollectionDetail(id, cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  let items: AdminPieceListItem[] = [];
  let total = 0;
  let pieceStats = { total: 0, published: 0, drafts: 0, archived: 0 };

  try {
    const [piecesRes, statsRes] = await Promise.all([
      fetchAdminPieces(page, ADMIN_PAGE_SIZE, cookieHeader, id, undefined, q),
      fetchAdminPieceStats(id, cookieHeader),
    ]);
    items = piecesRes.items;
    total = piecesRes.total;
    pieceStats = statsRes;
  } catch {
    items = [];
    total = 0;
  }

  const stats = [
    { id: 1, title: "Add Piece", count: pieceStats.total },
    { id: 2, title: "Published", count: pieceStats.published },
    { id: 3, title: "Drafts", count: pieceStats.drafts },
    { id: 4, title: "Archived", count: pieceStats.archived },
  ];

  return (
    <div className="space-y-6 pt-6 pb-[32px]">
      <div className="grid grid-cols-4 gap-5 py-[32px] border-b border-[#E1E4E8]">
        {stats?.map((stat) => {
          return (
            <div
              key={stat.id}
              className="h-28 flex flex-col items-start justify-center gap-3 bg-[#FBF7F7] p-6 rounded-xl"
            >
              <h6 className="font-heading text-[#353D48] font-bold text-h5 leading-[100%]">
                {stat.title}
              </h6>
              <p className="font-semibold text-h6">{stat.count}</p>
            </div>
          );
        })}
      </div>
      <RegisterPieceForm collectionId={id} />
      <CollectionPiecesFilter
        collectionId={id}
        collectionName={collection?.name}
      />
      <CollectionPiecesTable items={items} total={total} />
    </div>
  );
}
