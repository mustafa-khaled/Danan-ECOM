import { fetchAdminOrderDetail } from "@/features/admin/api/fetch-admin-orders";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ApiError } from "@/shared/lib/send-request";
import { formatAdminDate } from "@/shared/utils/format";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { OrderStatusUpdate } from "./order-status-update";

export default async function PaymentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieHeader = await getAdminCookieHeader();
  const [t, locale] = await Promise.all([
    getTranslations("admin"),
    getLocale() as Promise<Locale>,
  ]);
  let order;
  try {
    order = await fetchAdminOrderDetail(id, cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const placedAt = formatAdminDate(order.placedAt, locale);
  const firstItem = order.items[0];

  return (
    <>
      <div className="flex gap-[16px] px-7.5 py-3 [&>div]:rounded-xl [&>div]:h-15.5 [&>div]:bg-white">
        <div className="flex items-center justify-center w-15.5">
          <Link href="/admin/payments">
            <ArrowLeft className="size-6 rtl:rotate-180" />
          </Link>
        </div>
        <div className="w-full px-7.5 flex items-center justify-between">
          <h4 className="font-bold text-h6 text-neutral-800">
            {t("nav.payments")} / #{order.id.slice(0, 8)}
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
              {t("common.access")}
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
            <h4 className="font-heading mb-5 text-h4 font-bold">PAYMENT</h4>

            <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
              <ReadField
                label={t("payments.amount")}
                value={`${order.totalAmount} ${order.currency}`}
              />
              <ReadField
                label={t("payments.method")}
                value={order.paymentMethod ?? "—"}
              />
              <div className="col-span-2">
                <ReadField label={t("payments.transaction")} value={placedAt} />
              </div>
            </div>
          </div>

          <div className="mb-[32px] pb-5 border-b border-[#E1E4E8]">
            <h4 className="font-heading mb-5 text-h4 font-bold">PURCHASE</h4>

            <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
              <ReadField
                label={t("payments.piece")}
                value={firstItem?.piece?.serialNumber ?? "—"}
              />
              <ReadField
                label={`${t("payments.piece")} — ${t("common.collection")}`}
                value={firstItem?.piece?.name ?? "—"}
              />
            </div>
          </div>

          <div className="mb-[32px] pb-5 border-b border-[#E1E4E8]">
            <h4 className="font-heading mb-5 text-h4 font-bold">CUSTOMER</h4>

            <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
              <ReadField label="Name" value={order.client.displayName} />
              <ReadField label="Email" value={order.client.email} />
            </div>
          </div>

          <OrderStatusUpdate
            orderId={order.id}
            currentStatus={order.status}
            paymentStatus={order.paymentStatus ?? ""}
          />
        </div>
      </div>
    </>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[#272D35] text-h6 font-medium">{label}</label>
      <input
        type="text"
        readOnly
        value={value}
        className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
      />
    </div>
  );
}
