import Image from "next/image";

const stats = [
  {
    id: 1,
    title: "Origin",
    description: "Traditional Saudi mud houses...",
  },
  {
    id: 2,
    title: "Meaning",
    description: "Safety, reassurance, affection, and compassion.",
  },
  {
    id: 3,
    title: "Inspiration",
    description:
      "The triangular windows and architectural structure of the house.",
  },
] as const;

export default function CollectionStory() {
  return (
    <div>
      <div className="grid grid-cols-3 gap-5 py-[32px] border-b border-[#E1E4E8]">
        {stats?.map((stat) => {
          return (
            <div
              key={stat.id}
              className="h-28 flex flex-col items-start justify-center gap-3 bg-[#FBF7F7] p-6 rounded-xl"
            >
              <h6 className="font-heading uppercase text-[#353D48] font-bold text-h5 leading-[100%]">
                {stat.title}
              </h6>
              <p className="font-semibold text-h6">{stat.description}</p>
            </div>
          );
        })}
      </div>

      <div className="py-[32px] border-b border-[#E1E4E8]">
        <h4 className="uppercase font-heading mb-5 text-h4 font-bold">
          STORY GALLERY
        </h4>

        <div className="grid grid-cols-4 gap-5">
          <div className="relative h-90.75 w-full rounded-xl">
            <Image
              src="/assets/about-dadan.avif"
              alt=""
              fill
              className="rounded-xl object-cover"
            />
          </div>
          <div className="relative h-90.75 w-full rounded-xl">
            <Image
              src="/assets/about-dadan.avif"
              alt=""
              fill
              className="rounded-xl object-cover"
            />
          </div>

          <div className="relative h-90.75 w-full rounded-xl">
            <Image
              src="/assets/about-dadan.avif"
              alt=""
              fill
              className="rounded-xl object-cover"
            />
          </div>

          <div className="relative h-90.75 w-full rounded-xl">
            <Image
              src="/assets/about-dadan.avif"
              alt=""
              fill
              className="rounded-xl object-cover"
            />
          </div>
        </div>
      </div>

      <div className="py-[32px] border-b border-[#E1E4E8]">
        <h4 className="uppercase font-heading mb-5 text-h4 font-bold">
          CONTENT
        </h4>

        <ul className="bg-[#FBF7F7] p-6 rounded-xl space-y-3 [&>li]:flex [&>li]:gap-3 [&>li]:items-center [&>li]:text-[#4B5563] [&>li]:font-semibold [&>li]:text-h6">
          <li>
            Collection Story Stories of family, protection and belonging...
          </li>
          <li>
            Collection Story Stories of family, protection and belonging...
          </li>
        </ul>
      </div>
    </div>
  );
}
