"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { updateOrderStatus } from "@/features/admin/api/fetch-admin-orders";

const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "FULFILLED",
  "CANCELLED",
] as const;

interface OrderStatusUpdateProps {
  orderId: string;
  currentStatus: string;
  paymentStatus: string;
}

export function OrderStatusUpdate({
  orderId,
  currentStatus,
  paymentStatus,
}: OrderStatusUpdateProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  const mutation = useMutation({
    mutationFn: () => updateOrderStatus(orderId, selectedStatus),
    onSuccess: () => router.refresh(),
  });

  const hasChanged = selectedStatus !== currentStatus;

  return (
    <div>
      <h4 className="font-heading mb-5 text-h4 font-bold">ORDER STATUS</h4>

      <div className="grid grid-cols-2 gap-x-[32px] gap-y-3 mb-5">
        <div className="flex flex-col gap-2">
          <label className="text-[#272D35] text-h6 font-medium">
            Order Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border-none bg-[#F8FAFC] h-17.5 p-[16px] text-sm"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[#272D35] text-h6 font-medium">
            Payment Status
          </label>
          <input
            type="text"
            readOnly
            value={paymentStatus || "—"}
            className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
          />
        </div>
      </div>

      {mutation.isError && (
        <p className="mb-3 text-sm text-red-500">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Failed to update status"}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 w-full">
        <button
          type="button"
          disabled={!hasChanged || mutation.isPending}
          onClick={() => mutation.mutate()}
          className="w-40 h-11 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white disabled:opacity-50"
        >
          {mutation.isPending ? "Saving…" : "Update Status"}
        </button>
      </div>
    </div>
  );
}
