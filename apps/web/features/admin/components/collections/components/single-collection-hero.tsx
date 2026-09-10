"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoveDown, Plus } from "lucide-react";
import type { AdminCollectionDetail } from "@/features/admin/types";

const ROUTE_CONTENT: Record<
  string,
  { title: string; description: string; showActions: boolean }
> = {
  access: {
    title: "Access",
    description:
      "Manage House access, member classes, invitations, and permissions.",
    showActions: false,
  },
  settings: {
    title: "Settings",
    description:
      "Manage your House configuration, account, permissions, and system preferences.",
    showActions: false,
  },
};

interface SingleCollectionHeroProps {
  collection: AdminCollectionDetail | null;
}

export default function SingleCollectionHero({
  collection,
}: SingleCollectionHeroProps) {
  const pathname = usePathname();

  const isAccess =
    pathname.endsWith("/access") || pathname.includes("/access/");
  const isSettings =
    pathname.endsWith("/settings") || pathname.includes("/settings/");

  const routeKey = isAccess ? "access" : isSettings ? "settings" : null;
  const customContent = routeKey ? ROUTE_CONTENT[routeKey] : null;

  return (
    <>
      <div className="relative h-130.25 mt-6 mb-[40px] w-full">
        <Image
          src={collection?.coverImageUrl || ""}
          alt={collection?.name || ""}
          fill
          className="rounded-xl object-cover"
        />
      </div>

      <div className="flex items-start justify-between font-bold">
        <div>
          <h2 className="font-heading mb-[16px] text-[32px] leading-[100%]">
            {customContent ? customContent.title : collection?.name}
          </h2>
          <p className="text-[#4B5563] text-h5">
            {customContent ? (
              customContent.description
            ) : (
              <>
                A story inspired by
                <br />
                {collection?.description}
              </>
            )}
          </p>
        </div>

        {(!customContent || customContent.showActions) && (
          <div className="flex gap-3 self-end">
            <button
              type="button"
              className="w-37.5 h-12.25 text-body-lg font-semibold flex items-center justify-center gap-[16px] px-3 text-warm-900 bg-warm-500 rounded-lg hover:opacity-90 transition-opacity"
            >
              Download
              <MoveDown className="size-5" />
            </button>
            <Link href="/admin/collections/new">
              <button
                type="button"
                className="w-58 h-12.25 text-body-lg font-semibold flex items-center justify-center gap-[16px] px-3 text-teal-900 bg-[#4CBEAE] rounded-lg hover:opacity-90 transition-opacity"
              >
                Add New Collection
                <Plus className="size-5" />
              </button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
