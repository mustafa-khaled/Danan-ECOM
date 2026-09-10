import { ArrowUpLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const statsMockData = [
  {
    id: 1,
    title: "Members",
    count: 1248,
    icon: "/admin/profile-2user.svg",
    link: {
      title: "+32 This Month",
      href: "/",
    },
  },
  {
    id: 2,
    title: "Collections",
    description: "2 Draft",
    count: 8,
    icon: "/admin/trontron-(trx).svg",
  },
  {
    id: 3,
    title: "Pieces",
    description: "18 Recently Added",
    count: 364,
    icon: "/admin/binance-coin-(bnb).svg",
  },
  {
    id: 4,
    title: "Pending Transfers",
    description: "Require Review",
    count: 12,
    icon: "/admin/sms-tracking.svg",
  },
];

export default function Stats() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {statsMockData.map((s) => {
        return (
          <div
            key={s.id}
            className="p-6 rounded-2xl border-2 border-[#F3F3F3] h-48"
          >
            <div className="w-12 h-12 rounded-full bg-[#F6EFED] flex items-center justify-center">
              <Image src={s.icon} alt={s.title} width={24} height={24} />
            </div>
            <div className="mt-6 font-medium">
              <h6 className="font-heading text-[40px] text-neutral-900 leading-[100%] mb-0.75">
                {s.count}
              </h6>

              <div className="flex items-center justify-between text-[12px] text-neutral-600">
                <span>{s.title}</span>

                {s.description && <span>{s.description}</span>}
                {s.link?.href && (
                  <Link
                    href={s.link.href}
                    className="text-[#4CBEAE] flex items-center gap-3"
                  >
                    {s.link.title}

                    <span className="w-6 h-6 bg-[#EBFAF0] rounded-full flex items-center justify-center">
                      <ArrowUpLeft className="size-4" />
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
