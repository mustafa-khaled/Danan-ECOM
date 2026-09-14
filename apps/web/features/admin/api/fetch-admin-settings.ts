import { sendRequest } from "@/shared/lib/send-request";

export interface HouseSettings {
  id: string;
  houseName: string;
  description: string | null;
  contactEmail: string | null;
  supportContact: string | null;
  locale: string;
  timezone: string;
  privateHouseAccess: boolean;
  privateKeyRequired: boolean;
  adminApprovalRequired: boolean;
  allowInvitations: boolean;
  keyValidityMonths: number;
  requireKeyRenewal: boolean;
  notificationPrefs: Record<string, boolean>;
}

export function fetchHouseSettings(cookieHeader?: string) {
  return sendRequest<HouseSettings>({
    method: "GET",
    url: "/admin/settings",
    cookieHeader,
  });
}

export function updateHouseSettings(data: Partial<HouseSettings>) {
  return sendRequest<HouseSettings>({
    method: "PATCH",
    url: "/admin/settings",
    body: data,
  });
}

export interface AdminStaffUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  isActive: boolean;
}

export function fetchAdminStaff(cookieHeader?: string) {
  return sendRequest<AdminStaffUser[]>({
    method: "GET",
    url: "/admin/staff",
    cookieHeader,
  });
}

export function createAdminStaff(data: {
  email: string;
  displayName: string;
  role: string;
}) {
  return sendRequest<AdminStaffUser & { temporaryPassword: string }>({
    method: "POST",
    url: "/admin/staff",
    body: data,
  });
}

export function updateAdminStaff(
  id: string,
  data: { displayName?: string; role?: string; isActive?: boolean },
) {
  return sendRequest<AdminStaffUser>({
    method: "PATCH",
    url: `/admin/staff/${id}`,
    body: data,
  });
}
