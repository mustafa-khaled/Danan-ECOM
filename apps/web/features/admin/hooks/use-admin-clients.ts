import { queryOptions, useQuery } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import { adminKeys } from "@/shared/lib/query-keys";
import { fetchAdminClients } from "../api/fetch-admin-clients";
import type { Paginated } from "@/shared/types/common";
import type { AdminClientListItem } from "../types";

export const adminClientsQueryOptions = (
  page = 1,
  limit = 20,
  cookieHeader?: string,
) =>
  queryOptions({
    queryKey: adminKeys.clients(page, limit),
    queryFn: () => fetchAdminClients(page, limit, cookieHeader),
    placeholderData: keepPreviousData,
  });

export function useAdminClients(page = 1, limit = 20, cookieHeader?: string) {
  return useQuery(adminClientsQueryOptions(page, limit, cookieHeader));
}
