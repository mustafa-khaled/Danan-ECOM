"use client";

import { cn } from "@/lib/utils";
import SidebarLogo from "./sidebar-logo";
import NavigationArea from "./navigation-area";
import UserAccountFooter from "./user-account-footer";

interface AdminSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function AdminSidebar({
  mobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          aria-hidden="true"
          className="lg:hidden fixed inset-0 bg-black/40 z-40 transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 inset-s-0 bottom-0 pb-[40px] z-50 w-75 bg-ds-background border-e border-ds-border-light flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto shrink-0",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full rtl:translate-x-full",
        )}
      >
        <SidebarLogo onClose={onMobileClose} />
        {/* Scrollable Navigation Area */}
        <NavigationArea
          setMobileOpen={(open) => {
            if (!open) onMobileClose();
          }}
        />

        {/* User Account Footer */}
        <UserAccountFooter />
      </aside>
    </>
  );
}

