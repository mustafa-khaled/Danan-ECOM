"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuxuryButton } from "@/components/ui";
import { updatePiece, assignPiece } from "@/features/admin/api/fetch-admin-pieces";

interface PieceActionsProps {
  pieceId: string;
  currentStatus: string;
  hasOwner: boolean;
}

export function PieceActions({ pieceId, currentStatus, hasOwner }: PieceActionsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [clientId, setClientId] = useState("");
  const [acquisitionType, setAcquisitionType] = useState("ADMIN_ASSIGNMENT");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    setFeedback(null);

    try {
      await updatePiece(pieceId, { status: newStatus });
      setFeedback({ type: "success", message: `Status updated to ${newStatus.replace(/_/g, " ")}` });
      router.refresh();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to update status" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssign = async () => {
    if (!clientId.trim()) {
      setFeedback({ type: "error", message: "Client ID is required" });
      return;
    }

    setIsAssigning(true);
    setFeedback(null);

    try {
      await assignPiece(pieceId, { clientId: clientId.trim(), acquisitionType });
      setFeedback({ type: "success", message: "Piece assigned successfully" });
      setClientId("");
      router.refresh();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to assign piece" });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-[var(--radius-panel)] border p-4 ${
            feedback.type === "success"
              ? "border-green-500/40 bg-green-500/10"
              : "border-red-500/40 bg-red-500/10"
          }`}
        >
          <p className={feedback.type === "success" ? "text-green-500" : "text-red-500"}>
            {feedback.message}
          </p>
        </div>
      )}

      <div className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="mb-4 font-display text-lg tracking-[0.06em] uppercase text-[var(--color-ivory-muted)]">
          Update Status
        </h2>
        <div className="flex flex-wrap gap-3">
          {["AVAILABLE", "OWNED", "TRANSFER_PENDING", "RETIRED"].map((status) => (
            <LuxuryButton
              key={status}
              variant="ghost"
              size="sm"
              disabled={currentStatus === status}
              loading={isUpdating}
              onClick={() => handleStatusChange(status)}
              className={currentStatus === status ? "opacity-40" : ""}
            >
              {status.replace(/_/g, " ")}
            </LuxuryButton>
          ))}
        </div>
      </div>

      {!hasOwner && (
        <div className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="mb-4 font-display text-lg tracking-[0.06em] uppercase text-[var(--color-ivory-muted)]">
            Assign to Client
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="assign-clientId" className="mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--color-ivory-muted)]">
                Client ID
              </label>
              <input
                id="assign-clientId"
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Client UUID"
                className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="assign-acquisitionType" className="mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--color-ivory-muted)]">
                Acquisition Type
              </label>
              <select
                id="assign-acquisitionType"
                value={acquisitionType}
                onChange={(e) => setAcquisitionType(e.target.value)}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
              >
                <option value="ADMIN_ASSIGNMENT">Admin Assignment</option>
                <option value="PURCHASE">Purchase</option>
                <option value="GIFT">Gift</option>
                <option value="INHERITANCE">Inheritance</option>
              </select>
            </div>
            <div className="flex items-end">
              <LuxuryButton
                onClick={handleAssign}
                loading={isAssigning}
                size="sm"
              >
                Assign
              </LuxuryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
