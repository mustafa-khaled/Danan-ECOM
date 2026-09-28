"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AdminRole } from "@/shared/lib/admin-nav";

export interface AdminContextValue {
  displayName: string;
  email?: string;
  role: AdminRole;
  avatarUrl?: string;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({
  admin,
  children,
}: {
  admin: AdminContextValue;
  children: ReactNode;
}) {
  return (
    <AdminContext.Provider value={admin}>{children}</AdminContext.Provider>
  );
}

export function useAdmin(): {
  admin: AdminContextValue;
  role: AdminRole;
  isViewer: boolean;
  canWrite: boolean;
  isSuperAdmin: boolean;
} {
  const context = useContext(AdminContext);
  const admin: AdminContextValue = context ?? {
    displayName: "Admin",
    role: "VIEWER",
  };
  const isViewer = admin.role === "VIEWER";
  return {
    admin,
    role: admin.role,
    isViewer,
    canWrite: !isViewer,
    isSuperAdmin: admin.role === "SUPER_ADMIN",
  };
}
