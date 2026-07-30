"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuxuryButton } from "@/components/ui";
import { regenerateCertificate } from "@/features/admin/api/fetch-admin-certificates";

interface RegenerateButtonProps {
  pieceId: string;
  certificateId: string;
}

export function RegenerateButton({ pieceId }: RegenerateButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleRegenerate = async () => {
    setIsLoading(true);
    setFeedback(null);

    try {
      await regenerateCertificate(pieceId);
      setFeedback({ type: "success", message: "Certificate regenerated" });
      router.refresh();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to regenerate" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <LuxuryButton
        variant="ghost"
        size="sm"
        onClick={handleRegenerate}
        loading={isLoading}
      >
        Regenerate
      </LuxuryButton>
      {feedback && (
        <span
          role="status"
          aria-live="polite"
          className={`text-xs ${feedback.type === "success" ? "text-green-500" : "text-red-500"}`}
        >
          {feedback.message}
        </span>
      )}
    </div>
  );
}
