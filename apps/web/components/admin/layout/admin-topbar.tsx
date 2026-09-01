"use client";

import * as React from "react";
import { Bell, ChevronDown } from "lucide-react";
import Image from "next/image";
import LanguageToggle from "./language-toggle";

interface AdminTopbarProps {
  title?: string;
  admin?: {
    displayName?: string;
    avatarUrl?: string;
  };
}

export function AdminTopbar({
  title = "Collections",
  admin,
}: AdminTopbarProps) {
  return (
    <>
      <header className="flex items-center justify-between h-21.5 px-7.5 bg-white">
        <h1 className="font-heading font-bold text-[32px]">{title}</h1>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* Bell Notification */}
          <button
            type="button"
            className="relative p-2 rounded-full text-ds-text-secondary hover:text-ds-text hover:bg-ds-surface transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="size-7.5" fill="" />
            <span className="absolute top-1 right-1.5 w-4 h-4 bg-ds-error text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
              2
            </span>
          </button>

          <LanguageToggle />

          <div className="w-14 h-14 rounded-full bg-[#EAECF0] flex items-center justify-center">
            <Image
              src={admin?.avatarUrl || "/admin/user-admin.png"}
              alt={admin?.displayName || "User"}
              className=" rounded-full border-3 border-white"
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
