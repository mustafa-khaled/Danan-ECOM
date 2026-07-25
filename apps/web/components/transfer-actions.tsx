"use client";

import { useTranslations } from "next-intl";
import { LuxuryButton } from "@/components/ui";
import { useConfirmTransferSender, useConfirmTransferRecipient, useCancelTransfer } from "@/features/transfers";

interface TransferActionsProps {
  transferId: string;
  status: string;
  role: "sender" | "recipient" | "none";
}

export function TransferActions({ transferId, status, role }: TransferActionsProps) {
  const t = useTranslations("transfers");
  const {
    mutateAsync: confirmSender,
    isPending: isConfirmingSender,
    error: confirmSenderError,
  } = useConfirmTransferSender();
  const {
    mutateAsync: confirmRecipient,
    isPending: isConfirmingRecipient,
    error: confirmRecipientError,
  } = useConfirmTransferRecipient();
  const {
    mutateAsync: cancel,
    isPending: isCancelling,
    error: cancelError,
  } = useCancelTransfer();

  const canConfirmSender = role === "sender" && status === "INITIATED";
  const canConfirmRecipient = role === "recipient" && status === "SENDER_CONFIRMED";
  const canCancel =
    role === "sender" && ["INITIATED", "SENDER_CONFIRMED"].includes(status);

  const error = confirmSenderError ?? confirmRecipientError ?? cancelError;

  if (!canConfirmSender && !canConfirmRecipient && !canCancel) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {canConfirmSender ? (
        <LuxuryButton
          loading={isConfirmingSender}
          onClick={async () => {
            try {
              await confirmSender(transferId);
            } catch { /* error rendered via mutation state */ }
          }}
        >
          {t("confirmAsSender")}
        </LuxuryButton>
      ) : null}
      {canConfirmRecipient ? (
        <LuxuryButton
          loading={isConfirmingRecipient}
          onClick={async () => {
            try {
              await confirmRecipient(transferId);
            } catch { /* error rendered via mutation state */ }
          }}
        >
          {t("confirmAsRecipient")}
        </LuxuryButton>
      ) : null}
      {canCancel ? (
        <LuxuryButton
          variant="danger"
          loading={isCancelling}
          onClick={async () => {
            try {
              await cancel(transferId);
            } catch { /* error rendered via mutation state */ }
          }}
        >
          {t("cancelTransfer")}
        </LuxuryButton>
      ) : null}
      {error ? (
        <p role="alert" className="w-full text-sm text-[var(--color-ruby)]">
          {error instanceof Error ? error.message : t("actionFailed")}
        </p>
      ) : null}
    </div>
  );
}
