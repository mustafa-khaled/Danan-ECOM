import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function OwnershipDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  console.log(id);
  return (
    <>
      <div className="flex gap-[16px] px-7.5 py-3 [&>div]:rounded-xl [&>div]:h-15.5 [&>div]:bg-white">
        <div className="flex items-center justify-center w-15.5">
          <Link href="/admin/ownership">
            <ArrowLeft className="size-6" />
          </Link>
        </div>
        <div className="w-full px-7.5 flex items-center justify-between">
          <h4 className="font-bold text-h6 text-neutral-800">
            Ownership Details
          </h4>
          <div className="flex items-center gap-2">
            <Image
              src="/admin/solar_home-2-line-duotone.svg"
              alt=""
              width={20}
              height={20}
            />

            <span>/</span>
            <span className="text-[14px] text-[#BF7266] bg-[#FBF7F7] py-1 px-2 rounded-lg transition-all">
              Access
            </span>
          </div>
        </div>
      </div>

      <div className="px-7.5 py-[16px]">
        <div className="p-6 bg-white rounded-3xl">
          <h1 className="font-heading border-b border-[#E1E4E8] pt-[16px] pb-[32px] text-[32px] font-bold text-[#212630] leading-[100%]">
            Ownership/Mawaddah Ring
          </h1>

          <div className="pt-5 pb-[32px] border-b border-[#E1E4E8]">
            <h4 className="font-heading mb-5 text-h4 font-bold">
              Member Overview
            </h4>

            <form>
              <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="mawaddahRing"
                    className="text-[#272D35] text-h6 font-medium"
                  >
                    Mawaddah Ring
                  </label>
                  <input
                    type="text"
                    name="mawaddahRing"
                    placeholder="Enter Mawaddah Ring"
                    id="mawaddahRing"
                    className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="currentOwner"
                    className="text-[#272D35] text-h6 font-medium"
                  >
                    Current Owner
                  </label>
                  <input
                    type="text"
                    name="currentOwner"
                    placeholder="Enter Current Owner"
                    id="currentOwner"
                    className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="ownershipStatus"
                    className="text-[#272D35] text-h6 font-medium"
                  >
                    Ownership Status
                  </label>
                  <input
                    type="text"
                    name="ownershipStatus"
                    placeholder="Enter Ownership Status"
                    id="ownershipStatus"
                    className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="acquired"
                    className="text-[#272D35] text-h6 font-medium"
                  >
                    Acquired
                  </label>
                  <input
                    type="text"
                    name="acquired"
                    placeholder="Enter Acquired"
                    id="acquired"
                    className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 w-full mt-[16px]">
                <button className="w-24 h-11 border border-[#EAE7E4] rounded-lg text-[14px] font-medium text-[#141210]">
                  Edit
                </button>
                <button className="w-24 h-11 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white">
                  Save
                </button>
              </div>
            </form>
          </div>

          <div className="pt-[32px]">
            <h4 className="font-heading text-h4 font-bold">
              Ownership Timeline
            </h4>

            <div className="pb-[32px] pt-6 border-b border-[#E1E4E8]">
              <div className="flex items-center gap-[32px] pb-5 border-b border-[#E1E4E8] font-semibold">
                <h6 className="font-heading text-h4">12 May 2026</h6>

                <p className="text-[#353D48] text-h6">
                  Ahmed Gad
                  <br />
                  Acquired Piece
                </p>
              </div>
              <div className="flex items-center gap-[32px] pt-5 font-semibold">
                <h6 className="font-heading text-h4">18 Aug 2026</h6>

                <p className="text-[#353D48] text-h6">
                  Transfer Requested <br />
                  Ahmed Gad → Omar Ali
                </p>
              </div>
            </div>
          </div>

          <div className="pt-[32px]">
            <h4 className="font-heading text-h4 font-bold mb-6">
              Transfer Details
            </h4>

            <div className="space-y-5 text-[#353D48] text-h6 [&>p]:border-[#E1E4E8] [&>p]:border-b [&>p]:pb-6 [&>p:last-child]:border-none">
              <p>
                Current Owner
                <br />
                Ahmed Gad
              </p>
              <p>
                Recipient
                <br />
                Omar Ali
              </p>
              <p>
                Transfer Type
                <br />
                Private Transfer
              </p>
              <p>
                Requested
                <br />
                18 Aug 2026
              </p>

              <p>
                Status
                <br />
                <span className="text-[#FFD648] font-medium text-[12px] bg-[#FFF9E5] px-2 py-1">
                  Pending
                </span>
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 w-full mt-[16px]">
              <button className="w-24 h-11 border border-[#EAE7E4] rounded-lg text-[14px] font-medium text-[#141210]">
                Reject
              </button>
              <button className="w-36 h-11 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white">
                Approve Transfer
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
