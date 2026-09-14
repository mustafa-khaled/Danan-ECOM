import { fetchAdminOrderDetail } from "@/features/admin/api/fetch-admin-orders";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ApiError } from "@/shared/lib/send-request";
import { ArrowLeft, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function PaymentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieHeader = await getAdminCookieHeader();
  let order;
  try {
    order = await fetchAdminOrderDetail(id, cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <>
      <div className="flex gap-[16px] px-7.5 py-3 [&>div]:rounded-xl [&>div]:h-15.5 [&>div]:bg-white">
        <div className="flex items-center justify-center w-15.5">
          <Link href="/admin/payments">
            <ArrowLeft className="size-6" />
          </Link>
        </div>
        <div className="w-full px-7.5 flex items-center justify-between">
          <h4 className="font-bold text-h6 text-neutral-800">
            Payments / #{order.id.slice(0, 8)}
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
            Payment #{order.id.slice(0, 8)}
          </h1>

          <div className="my-[32px] pb-5 border-b border-[#E1E4E8]">
            <h4 className="font-heading mb-5 text-h4 font-bold">PAYMENT </h4>

            <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="amount"
                  className="text-[#272D35] text-h6 font-medium"
                >
                  Amount
                </label>
                <input
                  type="text"
                  name="amount"
                    defaultValue={`${order.totalAmount} ${order.currency}`}
                    placeholder="Enter Amount"
                    id="amount"
                  className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="paymentMethod"
                  className="text-[#272D35] text-h6 font-medium"
                >
                  Payment Method
                </label>
                <input
                  type="text"
                  name="paymentMethod"
                  placeholder="Visa **** 3213"
                  id="paymentMethod"
                  className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>

              <div className="flex flex-col gap-2 col-span-2">
                <label
                  htmlFor="transactionDate"
                  className="text-[#272D35] text-h6 font-medium"
                >
                  Transaction Date
                </label>
                <input
                  type="text"
                  name="transactionDate"
                  placeholder="mm/dd/yyyy"
                  id="transactionDate"
                  className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>
            </div>
          </div>

          <div className="mb-[32px] pb-5 border-b border-[#E1E4E8]">
            <h4 className="font-heading mb-5 text-h4 font-bold">PURCHASE </h4>

            <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="pieceId"
                  className="text-[#272D35] text-h6 font-medium"
                >
                  Piece ID
                </label>
                <input
                  type="text"
                  name="pieceId"
                  placeholder="Enter piece ID"
                  id="pieceId"
                  className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="pieceCollection"
                  className="text-[#272D35] text-h6 font-medium"
                >
                  Piece - Collection{" "}
                </label>
                <input
                  type="text"
                  name="pieceCollection"
                  placeholder="Enter piece collection"
                  id="pieceCollection"
                  className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>
            </div>
          </div>

          <div className="mb-[32px]">
            <h4 className="font-heading mb-5 text-h4 font-bold">CUSTOMER </h4>

            <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
              <div>
                <input
                  type="text"
                  name="customerName"
                  placeholder="Ahmed Gad"
                  id="customerName"
                  className="border-none w-full bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>

              <div>
                <input
                  type="text"
                  name="memberID"
                  placeholder="Member ID:  DAD-00124"
                  id="memberID"
                  className="border-none w-full bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>

              <div className="col-span-2">
                <input
                  type="text"
                  name="subscriptionPlan"
                  placeholder="Class A"
                  id="subscriptionPlan"
                  className="border-none w-full bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-heading mb-5 text-h4 font-bold">OWNERSHIP</h4>
            <ul className="space-y-[16px] [&>li]:flex [&>li]:gap-[16px] [&>li]:items-center [&>li]:text-[#353D48] [&>li]:font-semibold [&>li]:text-h6 [&>li]:pb-[16px] [&>li:last-child]:pb-[32px] [&>li]:border-b [&>li]:border-[#E1E4E8]">
              <li>
                <span className="w-[16px] h-[16px] rounded-full flex items-center justify-center text-white bg-[#1EC58B]">
                  <Check className="size-3" />
                </span>
                Payment Completed
              </li>
              <li>
                <span className="w-[16px] h-[16px] rounded-full flex items-center justify-center text-white bg-[#1EC58B]">
                  <Check className="size-3" />
                </span>
                Ownership Assigned
              </li>
              <li>
                <span className="w-[16px] h-[16px] rounded-full flex items-center justify-center text-white bg-[#1EC58B]">
                  <Check className="size-3" />
                </span>
                Certificate Issued
              </li>
            </ul>
            <div className="flex items-center justify-end gap-3 w-full mt-[32px]">
              <button className="w-34.25 h-11 border border-[#EAE7E4] rounded-lg text-[14px] font-medium text-[#141210]">
                View Piece
              </button>
              <button className="w-34.25 h-11 border border-[#EAE7E4] rounded-lg text-[14px] font-medium text-[#141210]">
                View Member
              </button>
              <button className="w-34.25 h-11 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white">
                View Ownership
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
