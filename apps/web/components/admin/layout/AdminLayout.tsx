"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";
import { AdminProvider, type AdminContextValue } from "@/shared/providers/admin-context";
import type { AdminRole } from "@/shared/lib/admin-nav";

export interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  admin?: {
    displayName: string;
    email?: string;
    role: string;
    avatarUrl?: string;
  };
  pendingCount?: number;
}

export function AdminLayout({
  children,
  title,
  admin,
  pendingCount,
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = useTranslations("admin.common");

  // Fail closed: a render path that forgot to pass the session must not hand
  // out the write-enabled UI.
  const fallbackAdmin: AdminContextValue = {
    displayName: admin?.displayName ?? t("accountManager"),
    email: admin?.email,
    role: (admin?.role ?? "VIEWER") as AdminRole,
    avatarUrl: admin?.avatarUrl,
  };

  return (
    <AdminProvider admin={fallbackAdmin}>
      <div
        data-theme="admin"
        className="min-h-screen flex bg-[#A7AEC129] text-ds-text font-body"
      >
        <AdminSidebar
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          admin={fallbackAdmin}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminTopbar
            title={title}
            admin={fallbackAdmin}
            pendingCount={pendingCount}
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          />

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </AdminProvider>
  );
}
