"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Owned Pieces", href: "/beta/profile/wardrobe" },
  { label: "Certificates", href: "/beta/profile/certificates" },
  { label: "History", href: "/beta/profile/history" },
  { label: "Transfers", href: "/beta/profile/transfers" },
  { label: "Profile Management", href: "/beta/profile" },
];

const mainStyles =
  "w-full lg:h-[54px] h-[43px] lg:text-left lg:px-[12px] lg:text-[16px] text-[14px] bg-ds-surface font-bold transition-colors duration-200 cursor-pointer";

export default function ProfileAside() {
  const pathname = usePathname();

  return (
    <aside className="w-full xl:w-113.5 shrink-0">
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
        {navItems.map((item, index) => {
          const isActive =
            item.href === "/beta/profile"
              ? pathname === "/beta/profile"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                index === navItems.length - 1 ? "col-span-2 lg:col-span-1" : ""
              }
            >
              <button
                type="button"
                className={cn(
                  mainStyles,
                  isActive ? "bg-ds-primary" : "bg-ds-surface",
                )}
              >
                {item.label}
              </button>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
