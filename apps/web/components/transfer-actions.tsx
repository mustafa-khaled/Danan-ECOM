"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LuxuryButton } from "@dadan/ui";
import {
  ApiError,
  cancelTransfer,
  confirmTransferRecipient,
  confirmTransferSender,
} from "../lib/api";

interface TransferActionsProps {
  transferId: string;
  status: string;
  role: "sender" | "recipient" | "none";
}

export function TransferActions({ transferId, status, role }: TransferActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>, key: string) {
    setLoading(key);
    setError(null);
    try {
      await action();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setLoading(null);
    }
  }

  const canConfirmSender = role === "sender" && status === "INITIATED";
  const canConfirmRecipient = role === "recipient" && status === "SENDER_CONFIRMED";
  // Only the sender may cancel (the API rejects recipient cancellations).
  const canCancel =
    role === "sender" && ["INITIATED", "SENDER_CONFIRMED"].includes(status);

  if (!canConfirmSender && !canConfirmRecipient && !canCancel) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {canConfirmSender ? (
        <LuxuryButton
          loading={loading === "sender"}
          onClick={() => run(() => confirmTransferSender(transferId), "sender")}
        >
          Confirm as Sender
        </LuxuryButton>
      ) : null}
      {canConfirmRecipient ? (
        <LuxuryButton
          loading={loading === "recipient"}
          onClick={() => run(() => confirmTransferRecipient(transferId), "recipient")}
        >
          Confirm as Recipient
        </LuxuryButton>
      ) : null}
      {canCancel ? (
        <LuxuryButton
          variant="danger"
          loading={loading === "cancel"}
          onClick={() => run(() => cancelTransfer(transferId), "cancel")}
        >
          Cancel Transfer
        </LuxuryButton>
      ) : null}
      {error ? (
        <p role="alert" className="w-full text-sm text-[var(--color-ruby)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
