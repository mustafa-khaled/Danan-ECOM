import { sendRequest } from "@/shared/lib/send-request";
import type { Paginated } from "@/shared/types/common";
import type { AdminClientListItem, AdminClientDetail } from "../types";

export function fetchAdminClients(page = 1, limit = 20, cookieHeader?: string, search?: string) {
  return sendRequest<Paginated<AdminClientListItem>>({
    method: "GET",
    url: "/admin/clients",
    params: { page, limit, q: search },
    cookieHeader,
  });
}

export function fetchAdminClientDetail(id: string, cookieHeader?: string) {
  return sendRequest<AdminClientDetail>({
    method: "GET",
    url: `/admin/clients/${id}`,
    cookieHeader,
  });
}

export interface CreateClientInput {
  displayName: string;
  email: string;
  phone?: string;
  locale?: string;
  visibilityGroups?: string[];
}

export function createClient(data: CreateClientInput, cookieHeader?: string) {
  return sendRequest<AdminClientDetail>({
    method: "POST",
    url: "/admin/clients",
    body: data,
    cookieHeader,
  });
}

export interface UpdateClientInput {
  displayName?: string;
  email?: string;
  phone?: string;
  locale?: string;
  isActive?: boolean;
  visibilityGroups?: string[];
}

export function updateClient(id: string, data: UpdateClientInput, cookieHeader?: string) {
  return sendRequest<AdminClientDetail>({
    method: "PATCH",
    url: `/admin/clients/${id}`,
    body: data,
    cookieHeader,
  });
}

export function rotateClientKey(id: string, cookieHeader?: string) {
  return sendRequest<{ houseKey: string }>({
    method: "POST",
    url: `/admin/clients/${id}/rotate-key`,
    cookieHeader,
  });
}

export function updateClientVisibilityGroups(
  id: string,
  add?: string[],
  remove?: string[],
  cookieHeader?: string,
) {
  return sendRequest<AdminClientDetail>({
    method: "POST",
    url: `/admin/clients/${id}/visibility-groups`,
    body: { add, remove },
    cookieHeader,
  });
}
