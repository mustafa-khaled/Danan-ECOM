import { MoveRight } from "lucide-react";
import Image from "next/image";

const pendingActionsMockData = [
  {
    id: 1,
    title: "12 Transfer Requests",
    icon: "/admin/sms-tracking.svg",
  },
  {
    id: 2,
    title: "7 Membership Requests",
    icon: "/admin/profile-2user.svg",
  },

  {
    id: 3,
    title: "4 Certificates Ready",
    icon: "/admin/archive-tick.svg",
  },
] as const;

const membershipMockData = [
  {
    id: 1,
    title: "Class A",
    description: "124 Members",
  },
  {
    id: 2,
    title: "Class B",
    description: "542 Members",
  },
  {
    id: 3,
    title: "Class C",
    description: "882 Members",
  },
];

export default function PendingActions() {
  return (
    <div className="grid grid-cols-2 gap-[16px]">
      <div className="px-[32px] py-6 h-87.25 rounded-2xl border-2 border-[#F3F3F3]">
        <h3 className="font-bold text-h5 leading-[100%] text-[#29343D] mb-7.5">
          Pending Actions
        </h3>

        <div className="space-y-5 [&>div:last-child]:border-none">
          {pendingActionsMockData.map((item) => {
            return (
              <div
                key={item.id}
                className="pb-3 border-b border-neutral-200 h-17.25"
              >
                <div className="flex items-center gap-3">
                  <div className="w-[32px] h-[32px] rounded-full bg-[#F6EFED] flex items-center justify-center">
                    <Image
                      src={item.icon}
                      width={20}
                      height={20}
                      alt="pending-action-icon"
                    />
                  </div>
                  <h6 className="font-bold text-h6 leading-[100%] text-[#29343D]">
                    {item.title}
                  </h6>
                </div>

                <p className="flex items-center justify-between">
                  <span className="mt-3 font-bold text-[12px]">Review</span>
                  <MoveRight className="size-[16px]" />
                </p>
              </div>
            );
          })}
        </div>
      </div>
      <div className="px-[32px] py-6 h-87.25 rounded-2xl border-2 border-[#F3F3F3]">
        <h3 className="font-bold text-h5 leading-[100%] text-[#29343D] mb-7.5">
          Membership
        </h3>
        <div className="space-y-5 [&>div:last-child]:border-none">
          {membershipMockData.map((item) => {
            return (
              <div
                key={item.id}
                className="pb-3 border-b border-neutral-200 h-17.25"
              >
                <h6 className="font-bold text-h5 leading-[100%] text-[#29343D]">
                  {item.title}
                </h6>

                <p className="mt-2 font-medium text-h6 text-neutral-600">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
