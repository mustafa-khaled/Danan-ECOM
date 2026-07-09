import { queryOptions, useQuery } from "@tanstack/react-query";
import { collectionsKeys } from "@/shared/lib/query-keys";
import { fetchCollection } from "../api/fetch-collection";
import type { CollectionDetail } from "../types";

export const collectionQueryOptions = (slug: string, cookieHeader?: string) =>
  queryOptions({
    queryKey: collectionsKeys.detail(slug),
    queryFn: () => fetchCollection(slug, cookieHeader),
  });

export function useCollection(slug: string, cookieHeader?: string) {
  return useQuery(collectionQueryOptions(slug, cookieHeader));
}
