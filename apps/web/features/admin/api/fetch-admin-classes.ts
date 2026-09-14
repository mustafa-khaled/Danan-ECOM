import { sendRequest } from "@/shared/lib/send-request";
import type { AdminClass } from "../types";

export function fetchAdminClasses(cookieHeader?: string) {
  return sendRequest<AdminClass[]>({
    method: "GET",
    url: "/admin/classes",
    cookieHeader,
  });
}

export function fetchAdminClassDetail(id: string, cookieHeader?: string) {
  return sendRequest<AdminClass>({
    method: "GET",
    url: `/admin/classes/${id}`,
    cookieHeader,
  });
}

export interface CreateClassInput {
  name: string;
  nameAr?: string;
  slug: string;
  description?: string;
  sortOrder?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export function createClass(data: CreateClassInput, cookieHeader?: string) {
  return sendRequest<AdminClass>({
    method: "POST",
    url: "/admin/classes",
    body: data,
    cookieHeader,
  });
}

export interface UpdateClassInput {
  name?: string;
  nameAr?: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export function updateClass(
  id: string,
  data: UpdateClassInput,
  cookieHeader?: string,
) {
  return sendRequest<AdminClass>({
    method: "PATCH",
    url: `/admin/classes/${id}`,
    body: data,
    cookieHeader,
  });
}

export function deleteClass(id: string, cookieHeader?: string) {
  return sendRequest<AdminClass>({
    method: "DELETE",
    url: `/admin/classes/${id}`,
    cookieHeader,
  });
}
