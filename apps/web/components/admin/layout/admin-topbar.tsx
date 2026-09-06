"use client";

import { Bell, Menu } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import LanguageToggle from "./language-toggle";

interface AdminTopbarProps {
  title?: string;
  admin?: {
    displayName?: string;
    avatarUrl?: string;
  };
  onToggleSidebar?: () => void;
}

function getTitleFromPathname(pathname: string): string {
  const path = pathname.replace(/\/$/, "");

  // Overview / Dashboard
  if (path === "/admin" || path === "/admin/overview") return "Overview";

  // Collections
  if (path === "/admin/collections") return "Collections";
  if (path === "/admin/collections/new") return "New Collection";
  if (path.match(/^\/admin\/collections\/[^/]+\/story$/)) return "Collection Story";
  if (path.match(/^\/admin\/collections\/[^/]+\/access$/)) return "Collection Access";
  if (path.match(/^\/admin\/collections\/[^/]+\/pieces$/)) return "Collection Pieces";
  if (path.match(/^\/admin\/collections\/[^/]+\/settings$/)) return "Collection Settings";
  if (path.match(/^\/admin\/collections\/[^/]+\/edit$/)) return "Edit Collection";
  if (path.match(/^\/admin\/collections\/[^/]+$/)) return "Collection Details";

  // Members
  if (path === "/admin/members") return "Members";
  if (path === "/admin/members/new") return "New Member";
  if (path.match(/^\/admin\/members\/[^/]+\/edit$/)) return "Edit Member";
  if (path.match(/^\/admin\/members\/[^/]+$/)) return "Member Details";

  // Ownership
  if (path === "/admin/ownership") return "Ownership";
  if (path === "/admin/ownership/new") return "New Ownership Record";
  if (path.match(/^\/admin\/ownership\/[^/]+\/transfer$/)) return "Transfer Ownership";
  if (path.match(/^\/admin\/ownership\/[^/]+\/certificate$/)) return "Ownership Certificate";
  if (path.match(/^\/admin\/ownership\/[^/]+$/)) return "Ownership Details";

  // Operations
  if (path === "/admin/operations") return "Operations";
  if (path === "/admin/operations/new") return "New Operation";
  if (path.match(/^\/admin\/operations\/[^/]+\/certificate$/)) return "Operation Certificate";
  if (path.match(/^\/admin\/operations\/[^/]+$/)) return "Operation Details";

  // Stories / Designs
  if (path === "/admin/designs") return "Stories";
  if (path === "/admin/designs/new") return "New Story";
  if (path.match(/^\/admin\/designs\/[^/]+$/)) return "Story Details";

  // Pieces
  if (path === "/admin/pieces") return "Pieces";
  if (path === "/admin/pieces/new") return "New Piece";
  if (path.match(/^\/admin\/pieces\/[^/]+$/)) return "Piece Details";

  // Other routes
  if (path === "/admin/orders") return "Orders";
  if (path === "/admin/payments" || path === "/admin/transfers") return "Payments";
  if (path === "/admin/analytics" || path === "/admin/verification-logs") return "Analytics";
  if (path === "/admin/settings") return "Settings";

  // Generic fallback for dynamic segments like /admin/[resource]/[id]
  const segments = path.split("/").filter(Boolean);
  const resource = segments[1];
  if (segments.length >= 3 && resource) {
    const singular = resource.endsWith("s") ? resource.slice(0, -1) : resource;
    const formatted = singular.charAt(0).toUpperCase() + singular.slice(1);
    return `${formatted} Details`;
  }
  if (segments.length >= 2 && resource) {
    return resource.charAt(0).toUpperCase() + resource.slice(1);
  }

  return "Dashboard";
}

export function AdminTopbar({
  title,
  admin,
  onToggleSidebar,
}: AdminTopbarProps) {
  const pathname = usePathname();
  const displayTitle = title || getTitleFromPathname(pathname);

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
            {displayTitle}
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
            <span className="absolute top-1 inset-e-1.5 w-4 h-4 bg-ds-error text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
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
