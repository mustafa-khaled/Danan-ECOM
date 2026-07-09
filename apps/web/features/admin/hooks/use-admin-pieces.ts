import { queryOptions, useQuery } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import { adminKeys } from "@/shared/lib/query-keys";
import { fetchAdminPieces } from "../api/fetch-admin-pieces";
import type { Paginated } from "@/shared/types/common";
import type { AdminPieceListItem } from "../types";

export const adminPiecesQueryOptions = (
  page = 1,
  limit = 20,
  cookieHeader?: string,
) =>
  queryOptions({
    queryKey: adminKeys.pieces(page, limit),
    queryFn: () => fetchAdminPieces(page, limit, cookieHeader),
    placeholderData: keepPreviousData,
  });

export function useAdminPieces(page = 1, limit = 20, cookieHeader?: string) {
  return useQuery(adminPiecesQueryOptions(page, limit, cookieHeader));
}
