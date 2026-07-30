"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { LuxuryButton } from "@/components/ui";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { open: boolean }) | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ ...options, open: true });
    });
  }, []);

  const handleConfirm = () => {
    resolveRef.current?.(true);
    setState(null);
  };

  const handleCancel = () => {
    resolveRef.current?.(false);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state?.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-message"
        >
          <div className="mx-4 w-full max-w-md rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl">
            <h2
              id="confirm-title"
              className="font-display text-xl tracking-[0.04em] uppercase"
            >
              {state.title}
            </h2>
            <p id="confirm-message" className="mt-3 text-sm text-[var(--color-ivory-muted)]">
              {state.message}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <LuxuryButton
                variant="ghost"
                size="sm"
                onClick={handleCancel}
              >
                {state.cancelLabel ?? "Cancel"}
              </LuxuryButton>
              <LuxuryButton
                size="sm"
                onClick={handleConfirm}
                className={
                  state.variant === "danger"
                    ? "bg-red-600 hover:bg-red-700"
                    : state.variant === "warning"
                      ? "bg-[var(--color-warning)] hover:opacity-90"
                      : ""
                }
              >
                {state.confirmLabel ?? "Confirm"}
              </LuxuryButton>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
