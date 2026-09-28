import {
  CollectionsStats,
  CollectionsTableFilter,
  CollectionTable,
} from "@/features/admin";
import type { AdminCollectionListItem } from "@/features/admin/types";
import { fetchAdminCollections } from "@/features/admin/api/fetch-admin-collections";
import { fetchAdminCollectionStats } from "@/features/admin/api/fetch-admin-stats";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ADMIN_PAGE_SIZE, parseAdminPage } from "@/shared/lib/parse-admin-page";
import { ApiError } from "@/shared/lib/send-request";
import { getTranslations } from "next-intl/server";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q } = await searchParams;
  const page = parseAdminPage(pageParam);
  const cookieHeader = await getAdminCookieHeader();
  const t = await getTranslations("admin");

  let isAccessDenied = false;
  let items: AdminCollectionListItem[] = [];
  let total = 0;
  let stats = { members: 0, collections: 0, hidden: 0, pieces: 0, pendingTransfers: 0 };

  try {
    const [collectionsRes, statsRes] = await Promise.all([
      fetchAdminCollections(page, ADMIN_PAGE_SIZE, cookieHeader, { q }),
      fetchAdminCollectionStats(cookieHeader),
    ]);
    items = collectionsRes.items;
    total = collectionsRes.total;
    stats = statsRes;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 403 || error.status === 401)) {
      isAccessDenied = true;
    } else {
      throw error;
    }
  }

  if (isAccessDenied) {
    return (
      <>
        <div className="bg-white h-15 px-7.5 flex items-center font-bold text-h5 text-neutral-800">
          {t("collections.banner")}
        </div>

        <div className="px-7.5 py-6.75">
          <div className="bg-white rounded-3xl p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto shadow-xs border border-[#F3F3F3]">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6">
              <ShieldAlert className="size-8" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-neutral-900 mb-2">
              {t("errors.accessDeniedTitle")}
            </h2>
            <p className="text-neutral-500 text-sm max-w-md mb-8">
              {t("errors.accessDeniedDescription")}
            </p>
            <Link
              href="/admin/overview"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              {t("common.backToDashboard")}
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="bg-white h-15 px-7.5 flex items-center font-bold text-h5 text-neutral-800">
        {t("collections.banner")}
      </div>

      <div className="px-7.5 py-6.75">
        <div className="bg-white rounded-3xl p-6 space-y-6">
          <CollectionsStats stats={stats} />

          <div className="space-y-4">
            <CollectionsTableFilter />
            <CollectionTable items={items} total={total} />
          </div>
        </div>
      </div>
    </>
  );
}
