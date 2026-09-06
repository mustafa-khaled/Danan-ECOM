import { PieceCard, Switch } from "@/components/ui";
import { ArrowLeft, MoveRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface MemberDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberDetailsPage({
  params,
}: MemberDetailsPageProps) {
  const { id } = await params;

  return (
    <>
      <div className="flex gap-[16px] px-7.5 py-3 [&>div]:rounded-xl [&>div]:h-15.5 [&>div]:bg-white">
        <div className="flex items-center justify-center w-15.5">
          <Link href="/admin/members">
            <ArrowLeft className="size-6" />
          </Link>
        </div>
        <div className="w-full px-7.5 flex items-center justify-between">
          <h4 className="font-bold text-h6 text-neutral-800">Members </h4>
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
            Member Details Page
          </h1>

          <div className="pt-5 pb-[32px] border-b border-[#E1E4E8]">
            <h4 className="font-heading mb-5 text-h4 font-bold">
              Member Overview
            </h4>

            <form>
              <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="memberId"
                    className="text-[#272D35] text-h6 font-medium"
                  >
                    Member ID
                  </label>
                  <input
                    type="text"
                    name="memberId"
                    placeholder="Enter Member ID"
                    id="memberId"
                    className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="email"
                    className="text-[#272D35] text-h6 font-medium"
                  >
                    Email
                  </label>
                  <input
                    type="text"
                    name="email"
                    placeholder="Enter Email"
                    id="email"
                    className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="joinedDate"
                    className="text-[#272D35] text-h6 font-medium"
                  >
                    Joined
                  </label>
                  <input
                    type="text"
                    name="joinedDate"
                    placeholder="Enter joined date"
                    id="joinedDate"
                    className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="lastActive"
                    className="text-[#272D35] text-h6 font-medium"
                  >
                    Last Active
                  </label>
                  <input
                    type="text"
                    name="lastActive"
                    placeholder="Enter last active"
                    id="lastActive"
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

          <div className="pt-5 pb-[32px] border-b border-[#E1E4E8]">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-heading text-h4 font-bold">Owned Pieces</h4>
                <p className="text-h6 font-semibold text-[#4B5563]">
                  8 pieces currently owned by this member
                </p>
              </div>

              <button className="h-14 w-51.75 p-[16px] flex items-center justify-between font-medium text-h6 border border-[#E1E4E8]">
                View All
                <MoveRight className="size-6" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-[16px] mt-5">
              <Link href={`/admin/members/${id}`}>
                <PieceCard
                  piece={{
                    id: "1",
                    name: "Heritage Pendant",
                    ownedSince: "June 2022",
                    imageUrl: "/assets/wardrobe.avif",
                  }}
                  className="lg:h-160! border-none"
                />
              </Link>
              <Link href={`/admin/members/${id}`}>
                <PieceCard
                  piece={{
                    id: "1",
                    name: "Heritage Pendant",
                    ownedSince: "June 2022",
                    imageUrl: "/assets/wardrobe.avif",
                  }}
                  className="lg:h-160! border-none"
                />
              </Link>

              <Link href={`/admin/members/${id}`}>
                <PieceCard
                  piece={{
                    id: "1",
                    name: "Heritage Pendant",
                    ownedSince: "June 2022",
                    imageUrl: "/assets/wardrobe.avif",
                  }}
                  className="lg:h-160! border-none"
                />
              </Link>
            </div>
          </div>

          <div className="py-[32px] border-b border-[#E1E4E8]">
            <h4 className="font-heading mb-5 text-h4 font-bold">
              House Access
            </h4>

            <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
              <div className="flex items-center justify-between p-[16px] bg-[#F8FAFC] h-17.5">
                <span className="text-h6 text-[#5D697A]">
                  Enter Your Access Key
                </span>
                <Switch
                  id="accessKeyToggle"
                  variant="success"
                  defaultChecked={true}
                  aria-label="Enter Your Access Key"
                />
              </div>
              <div className="flex items-center justify-between p-[16px] bg-[#F8FAFC] h-17.5">
                <span className="text-h6 text-[#5D697A]">
                  Require Private Key
                </span>
                <Switch
                  id="privateKeyToggle"
                  variant="success"
                  defaultChecked={true}
                  aria-label="Require Private Key"
                />
              </div>
              <div className="flex items-center justify-between p-[16px] bg-[#F8FAFC] h-17.5">
                <span className="text-h6 text-[#5D697A]">Admin Approval</span>
                <Switch
                  id="adminApprovalToggle"
                  variant="success"
                  defaultChecked={true}
                  aria-label="Admin Approval"
                />
              </div>
              <div className="flex items-center justify-between p-[16px] bg-[#F8FAFC] h-17.5">
                <span className="text-h6 text-[#5D697A]">
                  Allow Invitations
                </span>
                <Switch
                  id="allowInvitations"
                  variant="success"
                  defaultChecked={true}
                  aria-label="Allow Invitations"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
