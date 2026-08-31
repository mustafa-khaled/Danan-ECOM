"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import SidebarLogo from "./sidebar-logo";
import NavigationArea from "./navigation-area";
import UserAccountFooter from "./user-account-footer";

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 bg-ds-surface rounded-xl border border-ds-border-light shadow-sm text-ds-text"
          aria-label="Toggle Menu"
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 pb-[40px] z-40 w-75 bg-ds-background border-r border-ds-border-light flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto shrink-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarLogo />
        {/* Scrollable Navigation Area */}
        <NavigationArea setMobileOpen={setMobileOpen} />

        {/* User Account Footer */}
        <UserAccountFooter />
      </aside>
    </>
  );
}
