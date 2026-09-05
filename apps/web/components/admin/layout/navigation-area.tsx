import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils";

import {
  Landmark,
  LayoutGrid,
  CreditCard,
  LineChart,
  Settings,
  ChevronDown,
  Triangle,
  Gem,
  BookOpen,
  Boxes,
  Users,
  Crown,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";

interface SubItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  key: string;
  main: string;
  icon: LucideIcon;
  subItems: SubItem[];
}

// Single source of truth — no more duplicated House/Members/Ownership arrays.
const navLinks: NavGroup[] = [
  {
    key: "house",
    main: "House",
    icon: Landmark,
    subItems: [
      { label: "Overview", href: "/admin/overview", icon: Triangle },
      { label: "Collections", href: "/admin/collections", icon: Gem },
      { label: "Stories", href: "/admin/designs", icon: BookOpen },
      { label: "Pieces", href: "/admin/pieces", icon: Boxes },
    ],
  },
];

// Links that are single destinations, not accordions.
const directLinks: SubItem[] = [
  { label: "Members", href: "/admin/members", icon: Users },
  { label: "Ownership", href: "/admin/ownership", icon: Crown },
  { label: "Operations", href: "/admin/orders", icon: LayoutGrid },
  { label: "Payments", href: "/admin/transfers", icon: CreditCard },
  { label: "Analytics", href: "/admin/verification-logs", icon: LineChart },
];

// --- shared styling ---------------------------------------------------
// Every top-level nav row (group headers, direct links, settings) shares
// this base. The only thing that differs is how the row's children are
// justified: groups need `justify-between` to push the chevron to the
// end, everything else just needs `gap-3` between icon and label.
const NAV_ROW_BASE =
  "w-full flex items-center px-3 h-12.5 rounded-lg font-semibold text-h6 text-neutral-400 transition-colors cursor-pointer";

const PRIMARY_GROUP_STYLES = "bg-[#3C9A8D] text-white shadow-xs";

interface NavigationAreaProps {
  setMobileOpen: (open: boolean) => void;
}

export default function NavigationArea({ setMobileOpen }: NavigationAreaProps) {
  const pathname = usePathname();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = { house: true };
    navLinks.forEach((group) => {
      const isActive = group.subItems.some((item) =>
        pathname.startsWith(item.href),
      );
      if (isActive) initial[group.key] = true;
    });
    return initial;
  });

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex-1 overflow-y-auto px-2.5 py-5.5 space-y-3 font-body text-sm">
      {navLinks.map((group) => {
        const GroupIcon = group.icon;
        const isOpen = !!openGroups[group.key];
        const isPrimary = group.key === "house";

        return (
          <div key={group.key}>
            <button
              onClick={() => toggleGroup(group.key)}
              className={cn(
                NAV_ROW_BASE,
                "justify-between",
                isPrimary && PRIMARY_GROUP_STYLES,
              )}
            >
              <div className="flex items-center gap-3">
                <GroupIcon
                  className={cn("size-5", !isPrimary && "text-neutral-400")}
                />
                <span>{group.main}</span>
              </div>
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-300 ease-in-out",
                  isOpen && "rotate-180",
                  !isPrimary && "text-ds-text-muted",
                )}
              />
            </button>

            {/* grid-rows trick: animates height 0 -> auto without JS
                measuring the content, and opacity fades alongside it. */}
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                isOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <div className="mt-3 ms-2 space-y-3">
                  {group.subItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const active = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-2 text-neutral-400 h-[32px] px-[32px] rounded-lg font-medium text-[12px] hover:bg-neutral-50 transition-all",
                          active && "bg-neutral-50",
                        )}
                      >
                        <SubIcon className="size-[16px] text-neutral-400" />
                        <span>{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Every group has subItems, so every group gets a divider
                after it. Semantic <hr> instead of a bordered <div>. */}
            <hr className="mt-2 border-t border-neutral-200" />
          </div>
        );
      })}

      {directLinks.map((link) => {
        const Icon = link.icon;
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMobileOpen(false)}
          >
            <button className={cn(NAV_ROW_BASE, "gap-3")}>
              <Icon className={cn("size-5", !active && "text-neutral-400")} />
              <span>{link.label}</span>
            </button>
          </Link>
        );
      })}

      <hr className="mt-2 border-t border-neutral-200" />

      <Link href="/admin/settings" onClick={() => setMobileOpen(false)}>
        <button className={cn(NAV_ROW_BASE, "gap-3")}>
          <Settings className="size-5 text-neutral-400" />
          <span>Settings</span>
        </button>
      </Link>
    </div>
  );
}
