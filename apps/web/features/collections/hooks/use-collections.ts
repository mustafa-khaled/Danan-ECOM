import { queryOptions, useQuery } from "@tanstack/react-query";
import { collectionsKeys } from "@/shared/lib/query-keys";
import { fetchCollections } from "../api/fetch-collections";
import type { CollectionSummary } from "../types";

export const collectionsQueryOptions = (cookieHeader?: string) =>
  queryOptions({
    queryKey: collectionsKeys.list(),
    queryFn: () => fetchCollections(cookieHeader),
  });

export function useCollections(cookieHeader?: string) {
  return useQuery(collectionsQueryOptions(cookieHeader));
}
