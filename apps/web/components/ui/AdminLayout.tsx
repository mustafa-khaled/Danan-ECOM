import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminTopbar } from "@/components/admin-topbar";

export interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  admin?: {
    displayName: string;
    email?: string;
    role: string;
    avatarUrl?: string;
  };
}

export function AdminLayout({ children, title = "Collections", admin }: AdminLayoutProps) {
  const fallbackAdmin = admin || {
    displayName: "Account Manager",
    email: "ahmedgad@gmail.com",
    role: "SUPER_ADMIN",
  };

  return (
    <div data-theme="admin" className="min-h-screen flex bg-ds-surface-warm text-ds-text font-body">
      <AdminSidebar admin={fallbackAdmin} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar title={title} admin={fallbackAdmin} />
        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
