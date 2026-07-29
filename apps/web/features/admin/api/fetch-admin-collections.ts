import { sendRequest } from "@/shared/lib/send-request";
import type { Paginated } from "@/shared/types/common";
import type { AdminCollectionListItem, AdminCollectionDetail, AdminDesignListItem } from "../types";

export function fetchAdminCollections(
  page = 1,
  limit = 20,
  cookieHeader?: string,
) {
  return sendRequest<Paginated<AdminCollectionListItem>>({
    method: "GET",
    url: "/admin/collections",
    params: { page, limit },
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
  visibilityGroups?: string[];
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
  visibilityGroups?: string[];
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

export function fetchAdminDesigns(
  page = 1,
  limit = 20,
  collectionId?: string,
  cookieHeader?: string,
) {
  return sendRequest<Paginated<AdminDesignListItem>>({
    method: "GET",
    url: "/admin/designs",
    params: { page, limit, collectionId },
    cookieHeader,
  });
}

export interface CreateDesignInput {
  name: string;
  nameAr: string;
  slug: string;
  collectionId: string;
  story: string;
  storyAr: string;
  material: string;
  materialAr?: string;
  weight: number;
  dimensions: string;
  dimensionsAr?: string;
  basePrice: number;
  currency?: string;
  visibilityGroups?: string[];
}

export function createDesign(
  data: CreateDesignInput,
  cookieHeader?: string,
) {
  return sendRequest<AdminDesignListItem>({
    method: "POST",
    url: "/admin/designs",
    body: data,
    cookieHeader,
  });
}

export interface UpdateDesignInput {
  name?: string;
  nameAr?: string;
  slug?: string;
  collectionId?: string;
  story?: string;
  storyAr?: string;
  material?: string;
  materialAr?: string;
  weight?: number;
  dimensions?: string;
  dimensionsAr?: string;
  basePrice?: number;
  currency?: string;
  isActive?: boolean;
  visibilityGroups?: string[];
}

export function updateDesign(
  id: string,
  data: UpdateDesignInput,
  cookieHeader?: string,
) {
  return sendRequest<AdminDesignListItem>({
    method: "PATCH",
    url: `/admin/designs/${id}`,
    body: data,
    cookieHeader,
  });
}

export function deleteDesign(
  id: string,
  cookieHeader?: string,
) {
  return sendRequest<void>({
    method: "DELETE",
    url: `/admin/designs/${id}`,
    cookieHeader,
  });
}

export function fetchAdminDesignDetail(
  id: string,
  cookieHeader?: string,
) {
  return sendRequest<AdminDesignListItem>({
    method: "GET",
    url: `/admin/designs/${id}`,
    cookieHeader,
  });
}
