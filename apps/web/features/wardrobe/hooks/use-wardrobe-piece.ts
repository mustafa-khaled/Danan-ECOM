import { queryOptions, useQuery } from "@tanstack/react-query";
import { wardrobeKeys } from "@/shared/lib/query-keys";
import { fetchWardrobePiece } from "../api/fetch-wardrobe-piece";
import type { WardrobePiece } from "../types";

export const wardrobePieceQueryOptions = (pieceId: string, cookieHeader?: string) =>
  queryOptions({
    queryKey: wardrobeKeys.detail(pieceId),
    queryFn: () => fetchWardrobePiece(pieceId, cookieHeader),
  });

export function useWardrobePiece(pieceId: string, cookieHeader?: string) {
  return useQuery(wardrobePieceQueryOptions(pieceId, cookieHeader));
}
