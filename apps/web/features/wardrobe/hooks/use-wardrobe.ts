import { queryOptions, useQuery } from "@tanstack/react-query";
import { wardrobeKeys } from "@/shared/lib/query-keys";
import { fetchWardrobe } from "../api/fetch-wardrobe";
import type { WardrobePiece } from "../types";

export const wardrobeQueryOptions = (cookieHeader?: string) =>
  queryOptions({
    queryKey: wardrobeKeys.list(),
    queryFn: () => fetchWardrobe(cookieHeader),
  });

export function useWardrobe(cookieHeader?: string) {
  return useQuery(wardrobeQueryOptions(cookieHeader));
}
