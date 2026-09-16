"use client";

import Image from "next/image";
import { usePathname, useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function SingleCollectionHeader() {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const params = useParams();
  const id = params?.id as string;

  const basePath = `/admin/collections/${id}`;

  let currentTab: "overview" | "pieces" | "access" | "settings" = "overview";
  if (pathname.startsWith(`${basePath}/pieces`)) {
    currentTab = "pieces";
  } else if (pathname.startsWith(`${basePath}/access`)) {
    currentTab = "access";
  } else if (pathname.startsWith(`${basePath}/settings`)) {
    currentTab = "settings";
  }

  const TAB_TITLES = {
    overview: {
      title: t("topbar.collectionDetails"),
      badge: t("topbar.collectionDetails"),
    },
    pieces: {
      title: t("topbar.collectionPieces"),
      badge: t("topbar.collectionPieces"),
    },
    access: {
      title: t("topbar.collectionAccess"),
      badge: t("topbar.collectionAccess"),
    },
    settings: {
      title: t("topbar.collectionSettings"),
      badge: t("topbar.collectionSettings"),
    },
  };

  const currentConfig = TAB_TITLES[currentTab];
  const title = currentConfig.title;
  const badge = currentConfig.badge;

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
