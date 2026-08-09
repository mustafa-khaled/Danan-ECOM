"use client";

import { useState } from "react";
import { XCircle } from "lucide-react";
import { useCancelOrder } from "@/features/orders";

interface OrderCancelButtonProps {
  orderId: string;
  status: string;
}

export function OrderCancelButton({ orderId, status }: OrderCancelButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { cancelOrder, isPending, error } = useCancelOrder();

  if (status !== "PENDING") {
    return null;
  }

  const handleCancel = async () => {
    try {
      await cancelOrder(orderId);
      setShowConfirm(false);
    } catch {
      /* error handled by mutation state */
    }
  };

  if (showConfirm) {
    return (
      <div className="flex flex-col gap-3 p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-sm text-red-800">
          Are you sure you want to cancel this order? This action cannot be undone.
        </p>
        {error && (
          <p className="text-sm text-red-600">
            Failed to cancel order. Please try again.
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Cancelling..." : "Yes, Cancel Order"}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            No, Keep Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
    >
      <XCircle className="w-4 h-4" />
      Cancel Order
    </button>
  );
}
