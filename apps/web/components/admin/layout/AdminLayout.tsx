"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

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

  const fallbackAdmin = admin || {
    displayName: t("accountManager"),
    email: "ahmedgad@gmail.com",
    role: "SUPER_ADMIN",
  };

  return (
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
  );
}
