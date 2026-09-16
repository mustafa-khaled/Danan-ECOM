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
  Boxes,
  Users,
  Crown,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

interface SubItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  key: string;
  mainKey: string;
  icon: LucideIcon;
  subItems: SubItem[];
}

const navLinks: NavGroup[] = [
  {
    key: "house",
    mainKey: "house",
    icon: Landmark,
    subItems: [
      { labelKey: "overview", href: "/admin/overview", icon: Triangle },
      { labelKey: "collections", href: "/admin/collections", icon: Gem },
      { labelKey: "pieces", href: "/admin/pieces", icon: Boxes },
    ],
  },
];

const directLinks: SubItem[] = [
  { labelKey: "members", href: "/admin/members", icon: Users },
  { labelKey: "ownership", href: "/admin/ownership", icon: Crown },
  { labelKey: "operations", href: "/admin/operations", icon: LayoutGrid },
  { labelKey: "payments", href: "/admin/payments", icon: CreditCard },
  { labelKey: "analytics", href: "/admin/analytics", icon: LineChart },
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
  const t = useTranslations("admin.nav");

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
        const isGroupActive = group.subItems.some((item) =>
          pathname.startsWith(item.href),
        );

        return (
          <div key={group.key}>
            <button
              onClick={() => toggleGroup(group.key)}
              className={cn(
                NAV_ROW_BASE,
                "justify-between",
                isGroupActive && PRIMARY_GROUP_STYLES,
              )}
            >
              <div className="flex items-center gap-3">
                <GroupIcon
                  className={cn("size-5", !isGroupActive && "text-neutral-400")}
                />
                <span>{t(group.mainKey)}</span>
              </div>
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-300 ease-in-out",
                  isOpen && "rotate-180",
                  !isGroupActive && "text-ds-text-muted",
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
                    const active =
                      pathname === sub.href ||
                      pathname.startsWith(sub.href + "/");
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-2 text-neutral-400 h-[32px] px-[32px] rounded-lg font-medium text-[12px] hover:bg-neutral-50 transition-all",
                          active &&
                            "bg-neutral-50 text-neutral-800 font-semibold",
                        )}
                      >
                        <SubIcon
                          className={cn(
                            "size-[16px]",
                            active ? "text-[#3C9A8D]" : "text-neutral-400",
                          )}
                        />
                        <span>{t(sub.labelKey)}</span>
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
        const showDivider =
          link.href === "/admin/members" || link.href === "/admin/ownership";

        return (
          <div key={link.href}>
            <Link href={link.href} onClick={() => setMobileOpen(false)}>
              <button
                className={cn(
                  NAV_ROW_BASE,
                  "gap-3",
                  active && PRIMARY_GROUP_STYLES,
                )}
              >
                <Icon className={cn("size-5", !active && "text-neutral-400")} />
                <span>{t(link.labelKey)}</span>
              </button>
            </Link>
            {showDivider && <hr className="mt-2 border-t border-neutral-200" />}
          </div>
        );
      })}

      <hr className="mt-2 border-t border-neutral-200" />

      {(() => {
        const isSettingsActive = pathname.startsWith("/admin/settings");
        return (
          <Link href="/admin/settings" onClick={() => setMobileOpen(false)}>
            <button
              className={cn(
                NAV_ROW_BASE,
                "gap-3",
                isSettingsActive && PRIMARY_GROUP_STYLES,
              )}
            >
              <Settings
                className={cn(
                  "size-5",
                  !isSettingsActive && "text-neutral-400",
                )}
              />
              <span>{t("settings")}</span>
            </button>
          </Link>
        );
      })()}
    </div>
  );
}
