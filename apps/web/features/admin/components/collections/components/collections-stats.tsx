import Image from "next/image";

export default function CollectionsStats({
  stats,
}: {
  stats: { members: number; collections: number; pieces: number; pendingTransfers: number };
}) {
  const statsMockData = [
    {
      id: 1,
      title: "Members",
      count: stats.members,
      icon: "/admin/triangle.svg",
    },
    {
      id: 2,
      title: "Collections",
      count: stats.collections,
      icon: "/admin/tick-circle.svg",
    },
    {
      id: 3,
      title: "Pieces",
      count: stats.pieces,
      icon: "/admin/clipboard.svg",
    },
    {
      id: 4,
      title: "Pending Transfers",
      count: stats.pendingTransfers,
      icon: "/admin/document-copy.svg",
    },
  ];
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
