import { notFound } from "next/navigation";
import { fetchAdminCollectionDetail } from "@/features/admin/api/fetch-admin-collections";
import { fetchAdminPieces } from "@/features/admin/api/fetch-admin-pieces";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ApiError } from "@/shared/lib/send-request";
import { parseAdminPage, ADMIN_PAGE_SIZE } from "@/shared/lib/parse-admin-page";
import {
  CollectionPiecesFilter,
  CollectionPiecesTable,
} from "@/features/admin";
import type { AdminPieceListItem } from "@/features/admin/types";

const stats = [
  {
    id: 1,
    title: "Add Piece",
    count: 346,
  },
  {
    id: 2,
    title: "Published",
    count: 318,
  },
  {
    id: 3,
    title: "Drafts",
    count: 24,
  },

  {
    id: 4,
    title: "Archived",
    count: 3,
  },
] as const;

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

  try {
    const piecesRes = await fetchAdminPieces(
      page,
      ADMIN_PAGE_SIZE,
      cookieHeader,
      q,
    );

    const collectionNameLower = (collection?.name || "").toLowerCase();
    const collectionSlugLower = (collection?.slug || "").toLowerCase();

    const filtered = piecesRes.items.filter((p) => {
      const pCol = (p.collection || "").toLowerCase();
      return (
        !pCol || pCol === collectionNameLower || pCol === collectionSlugLower
      );
    });

    items = filtered.length > 0 ? filtered : piecesRes.items;
    total = filtered.length > 0 ? filtered.length : piecesRes.total;
  } catch {
    items = [];
    total = 0;
  }

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
      <CollectionPiecesFilter
        collectionId={id}
        collectionName={collection?.name}
      />
      <CollectionPiecesTable items={items} total={total} />
    </div>
  );
}
