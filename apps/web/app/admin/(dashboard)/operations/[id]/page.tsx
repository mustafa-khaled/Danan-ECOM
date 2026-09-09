import { ArrowLeft, Check } from "lucide-react";
import Image from "next/image";
import React from "react";
import Link from "next/link";

export default async function OperationsDePage({
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
          <Link href="/admin/operations">
            <ArrowLeft className="size-6" />
          </Link>
        </div>
        <div className="w-full px-7.5 flex items-center justify-between">
          <h4 className="font-bold text-h6 text-neutral-800">
            Operations / Transfer Request
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
            Ownership Transfer
          </h1>

          <div className="pt-5 pb-[32px] border-b border-[#E1E4E8]">
            <h4 className="font-heading mb-5 text-h4 font-bold">
              Ownership Overview
            </h4>

            <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
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
                  htmlFor="newOwner"
                  className="text-[#272D35] text-h6 font-medium"
                >
                  NEW OWNER
                </label>
                <input
                  type="text"
                  name="newOwner"
                  placeholder="Enter New Owner"
                  id="newOwner"
                  className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>
            </div>
          </div>

          <div className="my-[32px] pt-5 border-t border-[#E1E4E8]">
            <h4 className="font-heading mb-5 text-h4 font-bold">
              REQUEST DETAILS
            </h4>

            <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="transferType"
                  className="text-[#272D35] text-h6 font-medium"
                >
                  Transfer Type
                </label>
                <input
                  type="text"
                  name="transferType"
                  placeholder="Enter Transfer Type"
                  id="transferType"
                  className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="requested"
                  className="text-[#272D35] text-h6 font-medium"
                >
                  Requested
                </label>
                <input
                  type="text"
                  name="requested"
                  placeholder="Enter Requested"
                  id="requested"
                  className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>

              <div className="flex flex-col gap-2 col-span-2">
                <label
                  htmlFor="status"
                  className="text-[#272D35] text-h6 font-medium"
                >
                  Status
                </label>
                <input
                  type="text"
                  name="status"
                  placeholder="Enter Status"
                  id="status"
                  className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-heading mb-5 text-h4 font-bold">
              REQUIRED ACTION
            </h4>
            <ul className="space-y-[16px] [&>li]:flex [&>li]:gap-[16px] [&>li]:items-center [&>li]:text-[#353D48] [&>li]:font-semibold [&>li]:text-h6 [&>li]:pb-[16px] [&>li:last-child]:pb-[32px] [&>li]:border-b [&>li]:border-[#E1E4E8]">
              <li>
                <span className="w-[16px] h-[16px] rounded-full flex items-center justify-center text-white bg-[#1EC58B]">
                  <Check className="size-3" />
                </span>
                Recipient Verification{" "}
              </li>
              <li>
                <span className="w-[16px] h-[16px] rounded-full flex items-center justify-center text-white bg-[#1EC58B]">
                  <Check className="size-3" />
                </span>
                Recipient House Access{" "}
              </li>
              <li>
                <span className="w-[16px] h-[16px] rounded-full flex items-center justify-center text-white bg-[#1EC58B]">
                  <Check className="size-3" />
                </span>
                Ownership Eligibility
              </li>
            </ul>
            <div className="flex items-center justify-end gap-3 w-full mt-[32px]">
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
