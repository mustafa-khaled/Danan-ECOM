import { ArrowLeft, Link } from "lucide-react";
import Image from "next/image";

export default async function PaymentDetailsPage({
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
          <Link href="/admin/payments">
            <ArrowLeft className="size-6" />
          </Link>
        </div>
        <div className="w-full px-7.5 flex items-center justify-between">
          <h4 className="font-bold text-h6 text-neutral-800">
            Payments / #PAY-00124
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
            Payment #PAY-00124{" "}
          </h1>
        </div>
      </div>
    </>
  );
}
