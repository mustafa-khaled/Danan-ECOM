"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { rotateClientKey, updateClient } from "@/features/admin/api/fetch-admin-clients";

interface ClientActionsProps {
  clientId: string;
  isActive: boolean;
}

export function ClientActions({ clientId, isActive }: ClientActionsProps) {
  const router = useRouter();
  const [isRotating, setIsRotating] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);

  const handleRotateKey = async () => {
    setIsRotating(true);
    setFeedback(null);
    setNewKey(null);

    try {
      const result = await rotateClientKey(clientId);
      setNewKey(result.houseKey);
      setFeedback({ type: "success", message: "House Key rotated successfully. Save the new key — it won't be shown again." });
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to rotate key" });
    } finally {
      setIsRotating(false);
    }
  };

  const handleToggleActive = async () => {
    setIsToggling(true);
    setFeedback(null);

    try {
      await updateClient(clientId, { isActive: !isActive });
      setFeedback({ type: "success", message: `Client ${isActive ? "deactivated" : "activated"} successfully.` });
      router.refresh();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to update status" });
    } finally {
      setIsToggling(false);
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

      {newKey && (
        <div className="rounded-[var(--radius-panel)] border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 p-4">
          <p className="mb-2 text-sm font-medium text-[var(--color-gold)]">New House Key:</p>
          <code className="block break-all rounded bg-[var(--color-surface)] p-3 font-mono text-sm">
            {newKey}
          </code>
        </div>
      )}

      <div className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="mb-4 font-display text-lg tracking-[0.06em] uppercase text-[var(--color-ivory-muted)]">
          Account Actions
        </h2>
        <div className="flex flex-wrap gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleActive}
            loading={isToggling}
          >
            {isActive ? "Deactivate Client" : "Activate Client"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRotateKey}
            loading={isRotating}
          >
            Rotate House Key
          </Button>
        </div>
      </div>
    </div>
  );
}
