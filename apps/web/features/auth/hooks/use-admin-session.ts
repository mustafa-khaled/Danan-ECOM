import { queryOptions, useQuery } from "@tanstack/react-query";
import { authKeys } from "@/shared/lib/query-keys";
import { fetchAdminMe } from "../api/fetch-admin-me";

export const adminSessionQueryOptions = (cookieHeader?: string) =>
  queryOptions({
    queryKey: authKeys.adminMe(),
    queryFn: () => fetchAdminMe(cookieHeader),
  });

export function useAdminSession(cookieHeader?: string) {
  return useQuery(adminSessionQueryOptions(cookieHeader));
}
