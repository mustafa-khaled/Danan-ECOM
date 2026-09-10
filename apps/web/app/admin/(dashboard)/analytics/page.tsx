import {
  CollectionPerformance,
  MembersChart,
  MembershipDistribution,
  OwnershipChart,
} from "@/features/admin";
import { ArrowUpLeft } from "lucide-react";
import Link from "next/link";

const stats = [
  {
    id: 1,
    title: "Members",
    count: "1,248",
    link: {
      title: "8.4%",
      href: "/",
    },
  },
  {
    id: 2,
    title: "Active Members",
    count: "1,842",
    link: {
      title: "5.2%",
      href: "/",
    },
  },
  {
    id: 3,
    title: "Pieces Owned",
    count: "324",
    link: {
      title: "12.1%",
      href: "/",
    },
  },
  {
    id: 4,
    title: "Revenue",
    count: "238,500",
    link: {
      title: "14.2%",
      href: "/",
    },
  },
] as const;

export default function AnalyticsPage() {
  return (
    <>
      <div className="bg-white h-15 px-7.5 flex items-center font-bold text-h5 text-neutral-800">
        Understand House activity, member engagement, pieces, ownership and
        revenue.
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

                  {stat.link?.href && (
                    <Link
                      href={stat.link.href}
                      className="text-[#4CBEAE] flex items-center gap-3"
                    >
                      {stat.link.title}

                      <span className="w-6 h-6 bg-[#EBFAF0] rounded-full flex items-center justify-center">
                        <ArrowUpLeft className="size-4" />
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-[32px]">
            <div className="grid grid-cols-2 gap-[32px]">
              <MembersChart />
              <OwnershipChart />
            </div>

            <CollectionPerformance />

            <MembershipDistribution />
          </div>
        </div>
      </div>
    </>
  );
}
