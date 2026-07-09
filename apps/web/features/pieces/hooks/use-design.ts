import { queryOptions, useQuery } from "@tanstack/react-query";
import { piecesKeys } from "@/shared/lib/query-keys";
import { fetchDesign } from "../api/fetch-design";
import type { DesignDetail } from "../types";

export const designQueryOptions = (slug: string, cookieHeader?: string) =>
  queryOptions({
    queryKey: piecesKeys.detail(slug),
    queryFn: () => fetchDesign(slug, cookieHeader),
  });

export function useDesign(slug: string, cookieHeader?: string) {
  return useQuery(designQueryOptions(slug, cookieHeader));
}
