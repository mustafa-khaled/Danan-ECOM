import { queryOptions, useQuery } from "@tanstack/react-query";
import { savedKeys } from "@/shared/lib/query-keys";
import { fetchSaved } from "../api/fetch-saved";
import type { SavedEntry } from "../types";

export const savedQueryOptions = (cookieHeader?: string) =>
  queryOptions({
    queryKey: savedKeys.list(),
    queryFn: () => fetchSaved(cookieHeader),
  });

export function useSaved(cookieHeader?: string) {
  return useQuery(savedQueryOptions(cookieHeader));
}
