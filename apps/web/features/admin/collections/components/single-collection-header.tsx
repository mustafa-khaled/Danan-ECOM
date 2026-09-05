"use client";

import Image from "next/image";
import { usePathname, useParams } from "next/navigation";

const TAB_TITLES: Record<string, { title: string; badge: string }> = {
  overview: {
    title: "Collection Overview",
    badge: "Collection Preview",
  },
  story: {
    title: "Collection Story",
    badge: "Collection Story",
  },
  pieces: {
    title: "Collection Pieces",
    badge: "Collection Pieces",
  },
  access: {
    title: "Collection Access",
    badge: "Collection Access",
  },
  settings: {
    title: "Collection Settings",
    badge: "Collection Settings",
  },
};

export default function SingleCollectionHeader() {
  const pathname = usePathname();
  const params = useParams();
  const id = params?.id as string;

  const basePath = `/admin/collections/${id}`;

  let currentTab = "overview";
  if (pathname.startsWith(`${basePath}/story`)) {
    currentTab = "story";
  } else if (pathname.startsWith(`${basePath}/pieces`)) {
    currentTab = "pieces";
  } else if (pathname.startsWith(`${basePath}/access`)) {
    currentTab = "access";
  } else if (pathname.startsWith(`${basePath}/settings`)) {
    currentTab = "settings";
  }

  const currentConfig = TAB_TITLES[currentTab] ?? TAB_TITLES.overview;
  const title = currentConfig?.title ?? "Collection Overview";
  const badge = currentConfig?.badge ?? "Collection Preview";

  return (
    <div className="w-full px-7.5 flex items-center justify-between">
      <h4 className="font-bold text-h6 text-neutral-800">{title}</h4>
      <div className="flex items-center gap-2">
        <Image
          src="/admin/solar_home-2-line-duotone.svg"
          alt=""
          width={20}
          height={20}
        />

        <span>/</span>
        <span className="text-[14px] text-[#BF7266] bg-[#FBF7F7] py-1 px-2 rounded-lg transition-all">
          {badge}
        </span>
      </div>
    </div>
  );
}
