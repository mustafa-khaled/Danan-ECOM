"use client";

import { Bell, Menu } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import LanguageToggle from "./language-toggle";

interface AdminTopbarProps {
  title?: string;
  admin?: {
    displayName?: string;
    avatarUrl?: string;
  };
  pendingCount?: number;
  onToggleSidebar?: () => void;
}

function getTitleKeyFromPathname(pathname: string): string {
  const path = pathname.replace(/\/$/, "");

  if (path === "/admin" || path === "/admin/overview") return "overview";
  if (path === "/admin/collections") return "collections";
  if (path === "/admin/collections/new") return "newCollection";
  if (path.match(/^\/admin\/collections\/[^/]+\/access$/)) return "collectionAccess";
  if (path.match(/^\/admin\/collections\/[^/]+\/pieces$/)) return "collectionPieces";
  if (path.match(/^\/admin\/collections\/[^/]+\/settings$/)) return "collectionSettings";
  if (path.match(/^\/admin\/collections\/[^/]+\/edit$/)) return "editCollection";
  if (path.match(/^\/admin\/collections\/[^/]+$/)) return "collectionDetails";
  if (path === "/admin/members") return "members";
  if (path === "/admin/members/new") return "newMember";
  if (path.match(/^\/admin\/members\/[^/]+\/edit$/)) return "editMember";
  if (path.match(/^\/admin\/members\/[^/]+$/)) return "memberDetails";
  if (path === "/admin/ownership") return "ownership";
  if (path === "/admin/ownership/new") return "newOwnership";
  if (path.match(/^\/admin\/ownership\/[^/]+\/transfer$/)) return "transferOwnership";
  if (path.match(/^\/admin\/ownership\/[^/]+\/certificate$/)) return "ownershipCertificate";
  if (path.match(/^\/admin\/ownership\/[^/]+$/)) return "ownershipDetails";
  if (path === "/admin/operations") return "operations";
  if (path === "/admin/operations/new") return "newOperation";
  if (path.match(/^\/admin\/operations\/[^/]+\/certificate$/)) return "operationCertificate";
  if (path.match(/^\/admin\/operations\/[^/]+$/)) return "operationDetails";
  if (path === "/admin/pieces") return "pieces";
  if (path === "/admin/pieces/new") return "newPiece";
  if (path.match(/^\/admin\/pieces\/[^/]+\/edit$/)) return "editPiece";
  if (path.match(/^\/admin\/pieces\/[^/]+$/)) return "pieceDetails";
  if (path === "/admin/orders") return "orders";
  if (path === "/admin/payments" || path === "/admin/transfers") return "payments";
  if (path === "/admin/analytics" || path === "/admin/verification-logs") return "analytics";
  if (path === "/admin/settings") return "settings";
  return "dashboard";
}

export function AdminTopbar({
  title,
  admin,
  pendingCount = 0,
  onToggleSidebar,
}: AdminTopbarProps) {
  const pathname = usePathname();
  const t = useTranslations("admin.topbar");
  const displayTitle = title || t(getTitleKeyFromPathname(pathname));

  return (
    <>
      <header className="flex items-center justify-between h-21.5 px-4 sm:px-7.5 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl border border-ds-border-light bg-ds-surface shadow-xs text-ds-text hover:bg-neutral-100 transition-colors shrink-0"
              aria-label={t("toggleNav")}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <h1 className="font-heading font-bold text-xl sm:text-[32px] truncate">
            {displayTitle}
          </h1>
        </div>

        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          {/* Bell Notification */}
          <button
            type="button"
            className="relative p-2 rounded-full text-ds-text-secondary hover:text-ds-text hover:bg-ds-surface transition-colors cursor-pointer"
            aria-label={t("notifications")}
          >
            <Bell className="size-6 sm:size-7.5" fill="" />
            <span className="absolute top-1 inset-e-1.5 w-4 h-4 bg-ds-error text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
              {pendingCount}
            </span>
          </button>

          <LanguageToggle />

          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-[#EAECF0] flex items-center justify-center">
            <Image
              src={admin?.avatarUrl || "/admin/user-admin.png"}
              alt={admin?.displayName || t("user")}
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
