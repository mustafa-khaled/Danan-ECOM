import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchAdminCollectionDetail } from "@/features/admin/api/fetch-admin-collections";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ApiError } from "@/shared/lib/send-request";

export default async function CollectionStory({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieHeader = await getAdminCookieHeader();
  let collection;
  try {
    collection = await fetchAdminCollectionDetail(id, cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const stats = [
    { id: 1, title: "Origin", description: collection.origin || "Not set." },
    { id: 2, title: "Meaning", description: collection.meaning || "Not set." },
    {
      id: 3,
      title: "Inspiration",
      description: collection.inspiration || "Not set.",
    },
  ];
  const images = collection.storyImageUrls?.length
    ? collection.storyImageUrls
    : [];

  return (
    <div>
      <div className="grid grid-cols-3 gap-5 py-[32px] border-b border-[#E1E4E8]">
        {stats.map((stat) => {
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
          {images.length === 0 ? (
            <p className="text-h6 text-[#4B5563]">No story images yet.</p>
          ) : (
            images.map((src) => (
              <div key={src} className="relative h-90.75 w-full rounded-xl">
                <Image src={src} alt="" fill className="rounded-xl object-cover" />
              </div>
            ))
          )}
        </div>
      </div>

      <div className="py-[32px] border-b border-[#E1E4E8]">
        <h4 className="uppercase font-heading mb-5 text-h4 font-bold">
          CONTENT
        </h4>

        <ul className="bg-[#FBF7F7] p-6 rounded-xl space-y-3 [&>li]:flex [&>li]:gap-3 [&>li]:items-center [&>li]:text-[#4B5563] [&>li]:font-semibold [&>li]:text-h6">
          <li>{collection.storyContent || "No story content yet."}</li>
        </ul>
      </div>
    </div>
  );
}
