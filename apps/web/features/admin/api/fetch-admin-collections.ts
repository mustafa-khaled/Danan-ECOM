import { sendRequest } from "@/shared/lib/send-request";
import type { Paginated } from "@/shared/types/common";
import type { AdminCollectionListItem, AdminCollectionDetail } from "../types";

export function fetchAdminCollections(
  page = 1,
  limit = 20,
  cookieHeader?: string,
  filters?: { q?: string; isVisible?: boolean; classId?: string; sortBy?: string },
) {
  return sendRequest<Paginated<AdminCollectionListItem>>({
    method: "GET",
    url: "/admin/collections",
    params: { page, limit, ...filters },
    cookieHeader,
  });
}

export function fetchAdminCollectionDetail(
  id: string,
  cookieHeader?: string,
) {
  return sendRequest<AdminCollectionDetail>({
    method: "GET",
    url: `/admin/collections/${id}`,
    cookieHeader,
  });
}

export interface CreateCollectionInput {
  name: string;
  nameAr: string;
  slug: string;
  description?: string;
  descriptionAr?: string;
  isVisible?: boolean;
  sortOrder?: number;
  classIds?: string[];
}

export function createCollection(
  data: CreateCollectionInput,
  cookieHeader?: string,
) {
  return sendRequest<AdminCollectionDetail>({
    method: "POST",
    url: "/admin/collections",
    body: data,
    cookieHeader,
  });
}

export interface UpdateCollectionInput {
  name?: string;
  nameAr?: string;
  slug?: string;
  description?: string;
  descriptionAr?: string;
  isVisible?: boolean;
  sortOrder?: number;
  classIds?: string[];
}

export function updateCollection(
  id: string,
  data: UpdateCollectionInput,
  cookieHeader?: string,
) {
  return sendRequest<AdminCollectionDetail>({
    method: "PATCH",
    url: `/admin/collections/${id}`,
    body: data,
    cookieHeader,
  });
}

export function deleteCollection(
  id: string,
  cookieHeader?: string,
) {
  return sendRequest<void>({
    method: "DELETE",
    url: `/admin/collections/${id}`,
    cookieHeader,
  });
}
