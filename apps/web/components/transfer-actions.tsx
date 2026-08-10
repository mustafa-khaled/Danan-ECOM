"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { useConfirmTransferSender, useConfirmTransferRecipient, useCancelTransfer } from "@/features/transfers";

interface TransferActionsProps {
  transferId: string;
  status: string;
  role: "sender" | "recipient" | "none";
}

export function TransferActions({ transferId, status, role }: TransferActionsProps) {
  const t = useTranslations("transfers");
  const { confirmSender, isPending: isConfirmingSender, error: confirmSenderError } =
    useConfirmTransferSender();
  const { confirmRecipient, isPending: isConfirmingRecipient, error: confirmRecipientError } =
    useConfirmTransferRecipient();
  const { cancelTransfer, isPending: isCancelling, error: cancelError } = useCancelTransfer();

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
        <Button
          loading={isConfirmingSender}
          variant="primary"
          onClick={async () => {
            try {
              await confirmSender(transferId);
            } catch { /* error rendered via mutation state */ }
          }}
        >
          {t("confirmAsSender")}
        </Button>
      ) : null}
      {canConfirmRecipient ? (
        <Button
          loading={isConfirmingRecipient}
          variant="primary"
          onClick={async () => {
            try {
              await confirmRecipient(transferId);
            } catch { /* error rendered via mutation state */ }
          }}
        >
          {t("confirmAsRecipient")}
        </Button>
      ) : null}
      {canCancel ? (
        <Button
          variant="destructive"
          loading={isCancelling}
          onClick={async () => {
            try {
              await cancelTransfer(transferId);
            } catch { /* error rendered via mutation state */ }
          }}
        >
          {t("cancelTransfer")}
        </Button>
      ) : null}
      {error ? (
        <p role="alert" className="w-full text-sm text-ds-error font-body">
          {error instanceof Error ? error.message : t("actionFailed")}
        </p>
      ) : null}
    </div>
  );
}
