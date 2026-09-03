"use client";

import { Bell, Menu } from "lucide-react";
import Image from "next/image";
import LanguageToggle from "./language-toggle";

interface AdminTopbarProps {
  title?: string;
  admin?: {
    displayName?: string;
    avatarUrl?: string;
  };
  onToggleSidebar?: () => void;
}

export function AdminTopbar({
  title = "Collections",
  admin,
  onToggleSidebar,
}: AdminTopbarProps) {
  return (
    <>
      <header className="flex items-center justify-between h-21.5 px-4 sm:px-7.5 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl border border-ds-border-light bg-ds-surface shadow-xs text-ds-text hover:bg-neutral-100 transition-colors shrink-0"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <h1 className="font-heading font-bold text-xl sm:text-[32px] truncate">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          {/* Bell Notification */}
          <button
            type="button"
            className="relative p-2 rounded-full text-ds-text-secondary hover:text-ds-text hover:bg-ds-surface transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="size-6 sm:size-7.5" fill="" />
            <span className="absolute top-1 right-1.5 w-4 h-4 bg-ds-error text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
              2
            </span>
          </button>

          <LanguageToggle />

          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-[#EAECF0] flex items-center justify-center">
            <Image
              src={admin?.avatarUrl || "/admin/user-admin.png"}
              alt={admin?.displayName || "User"}
              className="rounded-full border-2 sm:border-3 border-white object-cover"
              width={47}
              height={47}
            />
          </div>
        </div>
      </header>

      <div className="bg-[#F4F4F4] h-px" />
    </>
  );
}
