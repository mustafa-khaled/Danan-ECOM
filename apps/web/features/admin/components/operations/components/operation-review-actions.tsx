"use client";

import { useCallback, useState } from "react";
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
  const [rejectState, setRejectState] = useState<"idle" | "confirming">("idle");
  const [rejectReason, setRejectReason] = useState("");
  const [issuedKey, setIssuedKey] = useState<string | null>(null);

  const copyKey = useCallback(async () => {
    if (issuedKey) {
      await navigator.clipboard.writeText(issuedKey);
    }
  }, [issuedKey]);

  const approve = useMutation({
    mutationFn: () =>
      kind === "transfer" ? approveTransfer(id) : approveStaffRequest(id),
    onSuccess: (result) => {
      // L-08: Display house key in a dismissible modal instead of window.alert()
      if ("houseKey" in result && result.houseKey) {
        setIssuedKey(result.houseKey as string);
      } else {
        router.refresh();
      }
    },
  });

  const reject = useMutation({
    mutationFn: async () => {
      if (kind === "transfer") {
        await rejectTransfer(id, rejectReason);
        return;
      }
      await rejectStaffRequest(id);
    },
    onSuccess: () => {
      setRejectState("idle");
      setRejectReason("");
      router.refresh();
    },
  });

  if (!canReview) return null;

  if (issuedKey) {
    return (
      <div className="mt-[16px] space-y-3 p-4 border border-[#E1E4E8] bg-[#F8FAFC] rounded-lg">
        <p className="text-[#272D35] text-h6 font-medium">
          House Key Issued (one-time view)
        </p>
        <code className="block p-3 bg-white border border-[#E1E4E8] text-sm font-mono break-all select-all">
          {issuedKey}
        </code>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={copyKey}
            className="w-36 h-11 border border-[#EAE7E4] rounded-lg text-[14px] font-medium text-[#141210]"
          >
            Copy to Clipboard
          </button>
          <button
            type="button"
            onClick={() => {
              setIssuedKey(null);
              router.refresh();
            }}
            className="w-24 h-11 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  if (rejectState === "confirming") {
    return (
      <div className="mt-[16px] space-y-3">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="rejectReason"
            className="text-[#272D35] text-h6 font-medium"
          >
            Rejection Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            id="rejectReason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Provide a reason for rejection…"
            rows={3}
            className="w-full border border-[#E1E4E8] bg-[#F8FAFC] p-3 text-sm resize-none focus:outline-none focus:border-[#BF7266]"
          />
        </div>
        {reject.isError && (
          <p className="text-sm text-red-500">
            {reject.error instanceof Error
              ? reject.error.message
              : "Failed to reject"}
          </p>
        )}
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            disabled={reject.isPending}
            onClick={() => {
              setRejectState("idle");
              setRejectReason("");
            }}
            className="w-24 h-11 border border-[#EAE7E4] rounded-lg text-[14px] font-medium text-[#141210]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!rejectReason.trim() || reject.isPending}
            onClick={() => reject.mutate()}
            className="w-40 h-11 bg-red-600 rounded-lg text-[14px] font-medium text-white disabled:opacity-50"
          >
            {reject.isPending ? "Rejecting…" : "Confirm Reject"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-3 w-full mt-[16px]">
      <button
        type="button"
        disabled={reject.isPending || approve.isPending}
        onClick={() =>
          kind === "transfer"
            ? setRejectState("confirming")
            : reject.mutate()
        }
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
