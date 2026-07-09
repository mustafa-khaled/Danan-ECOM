import { queryOptions, useQuery } from "@tanstack/react-query";
import { authKeys } from "@/shared/lib/query-keys";
import { fetchMe } from "../api/fetch-me";

export const clientSessionQueryOptions = (cookieHeader?: string) =>
  queryOptions({
    queryKey: authKeys.me(),
    queryFn: () => fetchMe(cookieHeader),
  });

export function useClientSession(cookieHeader?: string) {
  return useQuery(clientSessionQueryOptions(cookieHeader));
}
