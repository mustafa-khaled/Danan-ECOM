import { MoveRight } from "lucide-react";

const mockData = [
  {
    id: 1,
    title: "Collection Name",
    pieces: 42,
    owners: 324,
    link: "/",
  },
  {
    id: 2,
    title: "Collection Name",
    pieces: 42,
    owners: 324,
    link: "/",
  },
  {
    id: 3,
    title: "Collection Name",
    pieces: 42,
    owners: 324,
    link: "/",
  },

  {
    id: 4,
    title: "Collection Name",
    pieces: 42,
    owners: 324,
    link: "/",
  },
] as const;

export default function CollectionsOverview() {
  return (
    <div className="p-6 h-86.75 rounded-2xl border-2 text-[#29343D] border-[#F3F3F3]">
      <h3 className="font-bold text-h5">Collections Overview</h3>

      <div className="grid grid-cols-2 gap-6 mt-6 [&>div:nth-last-child(-n+2)]:border-none">
        {mockData.map((item) => {
          return (
            <div
              key={item.id}
              className="h-29.5 border-b border-[#F3F3F3] pb-3"
            >
              <h6 className="font-bold text-h6 leading-[100%]">{item.title}</h6>

              <div className="mt-2 mb-3 text-h6 font-medium text-neutral-600">
                <p>{item.pieces} Pieces</p>
                <p>{item.owners} Owners</p>
              </div>

              <p className="flex items-center justify-between">
                <span className="font-bold text-[12px]">View collection</span>
                <MoveRight className="size-[16px]" />
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
