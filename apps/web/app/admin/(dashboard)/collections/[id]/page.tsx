import { notFound } from "next/navigation";
import { fetchAdminCollectionDetail } from "@/features/admin/api/fetch-admin-collections";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ApiError } from "@/shared/lib/send-request";
import { Check } from "lucide-react";

const status = [
  {
    id: 1,
    title: "Pieces",
    count: 42,
  },
  {
    id: 2,
    title: "Owners",
    count: 324,
  },
  {
    id: 3,
    title: "Transfers",
    count: 18,
  },
] as const;

interface EditCollectionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCollectionPage({
  params,
}: EditCollectionPageProps) {
  const { id } = await params;
  const cookieHeader = await getAdminCookieHeader();

  let collection;
  try {
    collection = await fetchAdminCollectionDetail(id, cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const createdDate = collection?.createdAt
    ? new Date(collection.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "12 Jan 2026";

  const updatedDate = collection?.updatedAt
    ? new Date(collection.updatedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "02 Aug 2026";

  return (
    <div>
      <div className="grid grid-cols-3 gap-5 py-[32px] border-b border-[#E1E4E8]">
        <div className="h-28 flex flex-col items-start justify-center gap-3 bg-[#FBF7F7] p-6 rounded-xl">
          <h6 className="font-heading text-[#353D48] font-bold text-h5 leading-[100%]">
            Collection ID
          </h6>
          <p className="font-semibold text-h6">
            {collection?.slug ? collection.slug.toUpperCase() : id}
          </p>
        </div>

        <div className="h-28 flex flex-col items-start justify-center gap-3 bg-[#FBF7F7] p-6 rounded-xl">
          <h6 className="font-heading text-[#353D48] font-bold text-h5 leading-[100%]">
            Created
          </h6>
          <p className="font-semibold text-h6">{createdDate}</p>
        </div>

        <div className="h-28 flex flex-col items-start justify-center gap-3 bg-[#FBF7F7] p-6 rounded-xl">
          <h6 className="font-heading text-[#353D48] font-bold text-h5 leading-[100%]">
            Last Updated
          </h6>
          <p className="font-semibold text-h6">{updatedDate}</p>
        </div>
      </div>

      <div className="py-[32px] border-b border-[#E1E4E8]">
        <h4 className="uppercase font-heading mb-5 text-h4 font-bold">
          Collection Stats
        </h4>

        <div className="grid grid-cols-3 gap-5">
          {status?.map((s) => {
            return (
              <div
                key={s.id}
                className="h-28 flex flex-col items-start justify-center gap-3 bg-[#FBF7F7] p-6 rounded-xl"
              >
                <h6 className="font-heading text-[#353D48] font-bold text-h5 leading-[100%]">
                  {s.count}
                </h6>
                <p className="font-semibold text-h6">{s.title}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="py-[32px] border-b border-[#E1E4E8]">
        <h4 className="uppercase font-heading mb-5 text-h4 font-bold">
          COLLECTION HEALTH
        </h4>

        <ul className="bg-[#FBF7F7] p-6 rounded-xl space-y-3 [&>li]:flex [&>li]:gap-3 [&>li]:items-center [&>li]:text-[#353D48] [&>li]:font-semibold [&>li]:text-h6">
          <li>
            <span className="w-[16px] h-[16px] rounded-full flex items-center justify-center text-white bg-[#1EC58B]">
              <Check className="size-3" />
            </span>
            Collection Story
          </li>
          <li>
            <span className="w-[16px] h-[16px] rounded-full flex items-center justify-center text-white bg-[#1EC58B]">
              <Check className="size-3" />
            </span>
            Hero Image
          </li>
          <li>
            <span className="w-[16px] h-[16px] rounded-full flex items-center justify-center text-white bg-[#1EC58B]">
              <Check className="size-3" />
            </span>
            Pieces Added
          </li>
          <li>
            <span className="w-[16px] h-[16px] rounded-full flex items-center justify-center text-white bg-[#1EC58B]">
              <Check className="size-3" />
            </span>
            Access Rules Configured
          </li>
        </ul>
      </div>

      <div className="py-[32px] border-b border-[#E1E4E8]">
        <h4 className="uppercase font-heading mb-5 text-h4 font-bold">
          CONTENT
        </h4>

        <p className="bg-[#FBF7F7] p-6 rounded-xl font-semibold text-[#4B5563] text-h6">
          Collection Story Stories of family, protection and belonging...
        </p>
      </div>

      <div className="py-[32px] border-b border-[#E1E4E8]">
        <h4 className="uppercase font-heading mb-5 text-h4 font-bold">
          Access
        </h4>

        <ul className="bg-[#FBF7F7] p-6 rounded-xl space-y-3 [&>li]:flex [&>li]:gap-3 [&>li]:items-center [&>li]:text-[#353D48] [&>li]:font-semibold [&>li]:text-h6">
          <li>
            <span className="w-[16px] h-[16px] rounded-full flex items-center justify-center text-white bg-[#1EC58B]">
              <Check className="size-3" />
            </span>
            Class A
          </li>
          <li>
            <span className="w-[16px] h-[16px] rounded-full flex items-center justify-center text-white bg-[#1EC58B]">
              <Check className="size-3" />
            </span>
            Class B
          </li>
          <li>
            <span className="w-[16px] h-[16px] rounded-full flex items-center justify-center text-white bg-gray-300">
              <Check className="size-3" />
            </span>
            Class C
          </li>
        </ul>
      </div>
    </div>
  );
}
