"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Landmark,
  Triangle,
  Gem,
  BookOpen,
  Boxes,
  Users,
  Crown,
  LayoutGrid,
  CreditCard,
  LineChart,
  Settings,
  ChevronDown,
  ChevronUp,
  LogOut,
  CheckCircle2,
  Menu,
  X,
} from "lucide-react";
import { useLogout } from "@/features/auth";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  admin: {
    displayName: string;
    email?: string;
    role: string;
    avatarUrl?: string;
  };
}

export function DadanLogoIcon({ className = "w-7 h-7 text-ds-teal" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M20 4L36 33H4L20 4Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M20 13L29 28H11L20 13Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <line x1="20" y1="4" x2="20" y2="33" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function AdminSidebar({ admin }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, isPending } = useLogout();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [houseOpen, setHouseOpen] = React.useState(true);
  const [membersOpen, setMembersOpen] = React.useState(false);
  const [ownershipOpen, setOwnershipOpen] = React.useState(false);

  async function handleLogout() {
    try {
      await logout(undefined);
    } catch {
      /* ignore */
    }
    router.push("/admin/login");
  }

  const houseSubItems = [
    { label: "Overview", href: "/admin/dashboard", icon: Triangle },
    { label: "Collections", href: "/admin/collections", icon: Gem },
    { label: "Stories", href: "/admin/designs", icon: BookOpen },
    { label: "Pieces", href: "/admin/pieces", icon: Boxes },
  ];

  const membersSubItems = [
    { label: "Clients", href: "/admin/clients", icon: Users },
  ];

  const ownershipSubItems = [
    { label: "Certificates", href: "/admin/certificates", icon: Crown },
  ];

  const isHouseActive = houseSubItems.some((item) => pathname.startsWith(item.href));
  const isMembersActive = membersSubItems.some((item) => pathname.startsWith(item.href));
  const isOwnershipActive = ownershipSubItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 bg-ds-surface rounded-xl border border-ds-border-light shadow-sm text-ds-text"
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
          "fixed top-0 left-0 bottom-0 z-40 w-64 sm:w-72 bg-ds-background border-r border-ds-border-light flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto shrink-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Top Header */}
        <div className="p-6 border-b border-ds-border-light flex items-center justify-between">
          <div>
            <h1 className="font-heading text-lg font-bold tracking-tight text-ds-text leading-tight">
              The House of DADAN
            </h1>
            <p className="text-[10px] tracking-wider uppercase text-ds-text-secondary font-body mt-0.5 font-medium">
              A Private House of Craftsmanship
            </p>
          </div>
          <DadanLogoIcon className="w-7 h-7 text-ds-teal shrink-0" />
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3 font-body text-sm">
          {/* House Group Accordion */}
          <div>
            <button
              onClick={() => setHouseOpen(!houseOpen)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer",
                isHouseActive || houseOpen
                  ? "bg-ds-teal text-white shadow-xs"
                  : "text-ds-text-secondary hover:bg-neutral-50"
              )}
            >
              <div className="flex items-center gap-3">
                <Landmark className="w-5 h-5" />
                <span className="font-semibold tracking-wide">House</span>
              </div>
              {houseOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {houseOpen && (
              <div className="mt-2 ml-4 pl-4 border-l-2 border-ds-border-light space-y-1">
                {houseSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const active = pathname === sub.href;
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all",
                        active
                          ? "bg-ds-surface text-ds-text font-semibold"
                          : "text-ds-text-secondary hover:text-ds-text hover:bg-ds-surface-warm"
                      )}
                    >
                      <SubIcon className={cn("w-4 h-4 opacity-70", active && "opacity-100 text-ds-teal")} />
                      <span>{sub.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Members Accordion */}
          <div>
            <button
              onClick={() => setMembersOpen(!membersOpen)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-ds-text-secondary font-medium hover:bg-neutral-50 transition-colors cursor-pointer",
                isMembersActive && "text-ds-text font-semibold"
              )}
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-ds-text-secondary" />
                <span>Members</span>
              </div>
              {membersOpen ? <ChevronUp className="w-4 h-4 text-ds-text-muted" /> : <ChevronDown className="w-4 h-4 text-ds-text-muted" />}
            </button>
            {membersOpen && (
              <div className="mt-2 ml-4 pl-4 border-l-2 border-ds-border-light space-y-1">
                {membersSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const active = pathname === sub.href;
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all",
                        active
                          ? "bg-ds-surface text-ds-text font-semibold"
                          : "text-ds-text-secondary hover:text-ds-text hover:bg-ds-surface-warm"
                      )}
                    >
                      <SubIcon className="w-4 h-4 opacity-70" />
                      <span>{sub.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ownership Accordion */}
          <div>
            <button
              onClick={() => setOwnershipOpen(!ownershipOpen)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-ds-text-secondary font-medium hover:bg-neutral-50 transition-colors cursor-pointer",
                isOwnershipActive && "text-ds-text font-semibold"
              )}
            >
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-ds-text-secondary" />
                <span>Ownership</span>
              </div>
              {ownershipOpen ? <ChevronUp className="w-4 h-4 text-ds-text-muted" /> : <ChevronDown className="w-4 h-4 text-ds-text-muted" />}
            </button>
            {ownershipOpen && (
              <div className="mt-2 ml-4 pl-4 border-l-2 border-ds-border-light space-y-1">
                {ownershipSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const active = pathname === sub.href;
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all",
                        active
                          ? "bg-ds-surface text-ds-text font-semibold"
                          : "text-ds-text-secondary hover:text-ds-text hover:bg-ds-surface-warm"
                      )}
                    >
                      <SubIcon className="w-4 h-4 opacity-70" />
                      <span>{sub.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Direct Navigation Links */}
          <Link
            href="/admin/orders"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-ds-text-secondary font-medium hover:bg-neutral-50 transition-colors",
              pathname.startsWith("/admin/orders") && "bg-ds-surface text-ds-text font-semibold"
            )}
          >
            <LayoutGrid className="w-5 h-5 text-ds-text-secondary" />
            <span>Operations</span>
          </Link>

          <Link
            href="/admin/transfers"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-ds-text-secondary font-medium hover:bg-neutral-50 transition-colors",
              pathname.startsWith("/admin/transfers") && "bg-ds-surface text-ds-text font-semibold"
            )}
          >
            <CreditCard className="w-5 h-5 text-ds-text-secondary" />
            <span>Payments</span>
          </Link>

          <Link
            href="/admin/verification-logs"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-ds-text-secondary font-medium hover:bg-neutral-50 transition-colors",
              pathname.startsWith("/admin/verification-logs") && "bg-ds-surface text-ds-text font-semibold"
            )}
          >
            <LineChart className="w-5 h-5 text-ds-text-secondary" />
            <span>Analytics</span>
          </Link>

          <div className="pt-2 border-t border-ds-border-light">
            <Link
              href="/admin/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-ds-text-secondary font-medium hover:bg-neutral-50 transition-colors"
            >
              <Settings className="w-5 h-5 text-ds-text-secondary" />
              <span>Settings</span>
            </Link>
          </div>
        </div>

        {/* User Account Footer */}
        <div className="p-4 border-t border-ds-border-light">
          <div className="bg-ds-surface p-3 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-ds-border-light shrink-0 border border-ds-border-light flex items-center justify-center text-xs font-bold text-ds-primary">
                {admin.avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={admin.avatarUrl} alt={admin.displayName} className="w-full h-full object-cover" />
                ) : (
                  admin.displayName ? admin.displayName.substring(0, 2).toUpperCase() : "AM"
                )}
              </div>
              <div className="overflow-hidden min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold text-ds-text truncate">
                    {admin.role === "SUPER_ADMIN" ? "Account Manager" : admin.displayName || "Account Manager"}
                  </p>
                  <CheckCircle2 className="w-3.5 h-3.5 text-ds-primary fill-ds-primary/20 shrink-0" />
                </div>
                <p className="text-caption text-ds-text-secondary truncate">
                  {admin.email || "ahmedgad@gmail.com"}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={isPending}
              title="Sign Out"
              className="p-2 rounded-xl text-ds-error hover:bg-ds-error-bg transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
