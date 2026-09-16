"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { X } from "lucide-react";
import Link from "next/link";

interface SidebarLogoProps {
  onClose?: () => void;
}

export default function SidebarLogo({ onClose }: SidebarLogoProps) {
  const t = useTranslations("admin.brand");
  return (
    <Link href="/admin/overview">
      <div className="h-21.5 flex items-center justify-between gap-2 border-b border-[#E0E2E5] px-4.75">
        <div className="min-w-0 flex-1">
          <h1 className="font-heading font-semibold text-h5 text-neutral-900 truncate">
            {t("title")}
          </h1>
          <p className="text-neutral-600 font-medium text-[12px] truncate">
            {t("tagline")}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Image
            src="/admin/admin-logo.png"
            alt={t("logoAlt")}
            width={41}
            height={35}
          />
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={t("closeSidebar")}
              className="lg:hidden p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
