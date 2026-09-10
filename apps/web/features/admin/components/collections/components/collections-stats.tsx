import Image from "next/image";

const statsMockData = [
  {
    id: 1,
    title: "Members",
    count: 8,
    icon: "/admin/triangle.svg",
  },
  {
    id: 2,
    title: "Collections",
    count: 6,
    icon: "/admin/tick-circle.svg",
  },
  {
    id: 3,
    title: "Pieces",
    count: 2,
    icon: "/admin/clipboard.svg",
  },
  {
    id: 4,
    title: "Pending Transfers",
    count: 0,
    icon: "/admin/document-copy.svg",
  },
];

export default function CollectionsStats() {
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

              <span className="text-neutral-600 text-[12px] font-medium">
                {s.title}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
