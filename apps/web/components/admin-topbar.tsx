"use client";

import * as React from "react";
import { Bell, ChevronDown } from "lucide-react";

interface AdminTopbarProps {
  title?: string;
  admin?: {
    displayName?: string;
    avatarUrl?: string;
  };
}

export function AdminTopbar({ title = "Collections", admin }: AdminTopbarProps) {
  return (
    <header className="flex items-center justify-between py-6 px-4 sm:px-8 bg-transparent border-b border-ds-border-light">
      <h1 className="font-heading text-2xl sm:text-3xl font-medium tracking-[-0.02em] text-ds-text">
        {title}
      </h1>

      <div className="flex items-center gap-4 sm:gap-6">
        {/* Bell Notification */}
        <button
          type="button"
          className="relative p-2 rounded-full text-ds-text-secondary hover:text-ds-text hover:bg-ds-surface transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-ds-error text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
            2
          </span>
        </button>

        {/* Language Toggle Selector */}
        <button
          type="button"
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-ds-text-secondary hover:text-ds-text hover:bg-ds-surface transition-colors cursor-pointer"
        >
          <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          <span className="text-base leading-none">🇬🇧</span>
        </button>

        {/* User Profile Avatar */}
        <div className="w-9 h-9 rounded-full overflow-hidden border border-ds-border bg-ds-surface-warm flex items-center justify-center shrink-0 shadow-xs">
          {admin?.avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={admin.avatarUrl} alt={admin.displayName || "User"} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-ds-primary">
              {admin?.displayName ? admin.displayName.substring(0, 2).toUpperCase() : "AM"}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
