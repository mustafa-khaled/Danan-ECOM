"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useConfirm } from "@/components/confirm-dialog";
import {
  approveTransfer,
  rejectTransfer,
  contactSender,
  contactRecipient,
} from "@/features/admin/api/fetch-admin-transfers";

interface TransferActionsProps {
  transferId: string;
}

export function TransferActions({ transferId }: TransferActionsProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isContactingSender, setIsContactingSender] = useState(false);
  const [isContactingRecipient, setIsContactingRecipient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleApprove = async () => {
    const confirmed = await confirm({
      title: "Approve Transfer",
      message: "Are you sure you want to APPROVE this transfer? This will transfer ownership of the piece.",
      confirmLabel: "Approve",
      variant: "warning",
    });
    if (!confirmed) return;

    setIsApproving(true);
    setError(null);
    setSuccess(null);

    try {
      await approveTransfer(transferId);
      setSuccess("Transfer approved successfully. Ownership has been transferred.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve transfer");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    const confirmed = await confirm({
      title: "Reject Transfer",
      message: "Are you sure you want to REJECT this transfer? The piece will remain with the original owner.",
      confirmLabel: "Reject",
      variant: "danger",
    });
    if (!confirmed) return;

    setIsRejecting(true);
    setError(null);
    setSuccess(null);

    try {
      await rejectTransfer(transferId);
      setSuccess("Transfer rejected. The piece remains with the original owner.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject transfer");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleContactSender = async () => {
    setIsContactingSender(true);
    setError(null);
    setSuccess(null);

    try {
      await contactSender(transferId);
      setSuccess("Contact with sender logged.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log contact");
    } finally {
      setIsContactingSender(false);
    }
  };

  const handleContactRecipient = async () => {
    setIsContactingRecipient(true);
    setError(null);
    setSuccess(null);

    try {
      await contactRecipient(transferId);
      setSuccess("Contact with recipient logged.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log contact");
    } finally {
      setIsContactingRecipient(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" aria-live="assertive" className="rounded-[var(--radius-panel)] border border-red-500/40 bg-red-500/10 p-4">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {success && (
        <div role="status" aria-live="polite" className="rounded-[var(--radius-panel)] border border-green-500/40 bg-green-500/10 p-4">
          <p className="text-green-500">{success}</p>
        </div>
      )}

      <div className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="mb-4 font-display text-lg tracking-[0.06em] uppercase text-[var(--color-ivory-muted)]">
          Contact Log
        </h2>
        <p className="mb-4 text-sm text-[var(--color-ivory-muted)]">
          Record when you&apos;ve contacted the parties involved in this transfer.
        </p>
        <div className="flex gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleContactSender}
            loading={isContactingSender}
          >
            Log Contact with Sender
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleContactRecipient}
            loading={isContactingRecipient}
          >
            Log Contact with Recipient
          </Button>
        </div>
      </div>

      <div className="rounded-[var(--radius-panel)] border border-ds-warning-border bg-ds-warning-bg p-6">
        <h2 className="mb-4 font-heading text-lg font-bold tracking-tight text-ds-warning-text uppercase">
          DADAN Review Actions
        </h2>
        <p className="mb-4 text-sm text-ds-text-secondary font-body">
          As a SUPER_ADMIN, you can approve or reject this transfer.
          Make sure you&apos;ve contacted both parties before making a decision.
        </p>
        <div className="flex gap-4">
          <Button
            onClick={handleApprove}
            loading={isApproving}
            variant="teal"
          >
            Approve Transfer
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            loading={isRejecting}
          >
            Reject Transfer
          </Button>
        </div>
      </div>
    </div>
  );
}
