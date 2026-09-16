import {
  CollectionPerformance,
  MembersChart,
  MembershipDistribution,
  OwnershipChart,
} from "@/features/admin";
import { fetchAdminAnalytics } from "@/features/admin/api/fetch-admin-analytics";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { pickLocalized } from "@/shared/lib/pick-localized";
import { ArrowUpLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import Link from "next/link";

export default async function AnalyticsPage() {
  const cookieHeader = await getAdminCookieHeader();
  const [analytics, t, locale] = await Promise.all([
    fetchAdminAnalytics("12m", cookieHeader),
    getTranslations("admin"),
    getLocale() as Promise<Locale>,
  ]);

  const stats = [
    {
      id: 1,
      title: t("analytics.members"),
      count: analytics.kpis.members.toLocaleString(),
      link: { title: `${analytics.kpis.deltas.members}%`, href: "/admin/members" },
    },
    {
      id: 2,
      title: t("analytics.activeMembers"),
      count: analytics.kpis.activeMembers.toLocaleString(),
      link: { title: `${analytics.kpis.deltas.activeMembers}%`, href: "/admin/members" },
    },
    {
      id: 3,
      title: t("analytics.piecesOwned"),
      count: analytics.kpis.piecesOwned.toLocaleString(),
      link: { title: `${analytics.kpis.deltas.piecesOwned}%`, href: "/admin/ownership" },
    },
    {
      id: 4,
      title: t("analytics.revenue"),
      count: analytics.kpis.revenue.toLocaleString(),
      link: { title: `${analytics.kpis.deltas.revenue}%`, href: "/admin/payments" },
    },
  ];

  return (
    <>
      <div className="bg-white h-15 px-7.5 flex items-center font-bold text-h5 text-neutral-800">
        {t("analytics.banner")}
      </div>

      <div className="px-7.5 py-6.75">
        <div className="bg-white rounded-3xl p-6 space-y-6">
          <div className="grid grid-cols-4 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.id}
                className="flex flex-col font-medium items-start justify-center rounded-2xl border border-[#F3F3F3] p-6 h-30"
              >
                <h4 className="font-heading text-[40px]">${stat.count}</h4>

                <div className="flex items-center w-full justify-between text-[12px] text-neutral-600">
                  <span>{stat.title}</span>

                  <Link
                    href={stat.link.href}
                    className="text-[#4CBEAE] flex items-center gap-3"
                  >
                    {stat.link.title}

                    <span className="w-6 h-6 bg-[#EBFAF0] rounded-full flex items-center justify-center">
                      <ArrowUpLeft className="size-4" />
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-[32px]">
            <div className="grid grid-cols-2 gap-[32px]">
              <MembersChart data={analytics.membersOverTime} />
              <OwnershipChart data={analytics.ownershipOverTime} />
            </div>

            <CollectionPerformance
              data={analytics.collectionPerformance.map((row) => ({
                name: pickLocalized(locale, row.name, row.nameAr),
                views: row.views,
                saves: row.saves,
                acquisitions: row.acquisitions,
              }))}
            />

            <MembershipDistribution
              memberships={analytics.membershipDistribution.map((row) => ({
                label: pickLocalized(locale, row.name, row.nameAr),
                value: row.count,
                percentage: row.percentage,
              }))}
            />
          </div>
        </div>
      </div>
    </>
  );
}
