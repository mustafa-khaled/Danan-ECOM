"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  {
    segment: "",
    title: "Overview",
  },
  {
    segment: "story",
    title: "Story",
  },
  {
    segment: "pieces",
    title: "Pieces",
  },
  {
    segment: "access",
    title: "Access",
  },
  {
    segment: "settings",
    title: "Settings",
  },
] as const;

export default function SingleCollectionTabs() {
  const pathname = usePathname();
  const params = useParams();
  const id = params?.id as string;

  const basePath = `/admin/collections/${id}`;

  return (
    <div className="grid grid-cols-5 gap-3">
      {tabs.map((tab) => {
        const tabHref = tab.segment ? `${basePath}/${tab.segment}` : basePath;
        const isActive = tab.segment
          ? pathname === tabHref || pathname.startsWith(`${tabHref}/`)
          : pathname === basePath;

        return (
          <Link
            key={tab.title}
            href={tabHref}
            className={cn(
              "h-11 flex items-center justify-center text-[14px] uppercase rounded-lg transition-colors font-medium",
              isActive
                ? "bg-[#BF7266] text-white"
                : "bg-[#F6F7F9] text-[#0A2540] hover:bg-[#ECEEF2]",
            )}
          >
            {tab.title}
          </Link>
        );
      })}
    </div>
  );
}
