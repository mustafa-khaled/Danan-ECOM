"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  approveStaffRequest,
  rejectStaffRequest,
} from "@/features/admin/api/fetch-admin-operations";
import {
  approveTransfer,
  rejectTransfer,
} from "@/features/admin/api/fetch-admin-transfers";

export function OperationReviewActions({
  kind,
  id,
  canReview,
  approveLabel,
}: {
  kind: "transfer" | "staff";
  id: string;
  canReview: boolean;
  approveLabel: string;
}) {
  const router = useRouter();
  const approve = useMutation({
    mutationFn: () =>
      kind === "transfer" ? approveTransfer(id) : approveStaffRequest(id),
    onSuccess: (result) => {
      if ("houseKey" in result && result.houseKey) {
        window.alert(`House key issued once: ${result.houseKey}`);
      }
      router.refresh();
    },
  });
  const reject = useMutation({
    mutationFn: async () => {
      if (kind === "transfer") {
        await rejectTransfer(id);
        return;
      }
      await rejectStaffRequest(id);
    },
    onSuccess: () => router.refresh(),
  });

  if (!canReview) return null;

  return (
    <div className="flex items-center justify-end gap-3 w-full mt-[16px]">
      <button
        type="button"
        disabled={reject.isPending || approve.isPending}
        onClick={() => reject.mutate()}
        className="w-24 h-11 border border-[#EAE7E4] rounded-lg text-[14px] font-medium text-[#141210]"
      >
        Reject
      </button>
      <button
        type="button"
        disabled={approve.isPending || reject.isPending}
        onClick={() => approve.mutate()}
        className="w-36 h-11 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white"
      >
        {approveLabel}
      </button>
    </div>
  );
}
