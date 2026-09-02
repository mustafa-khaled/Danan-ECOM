"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

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
  const tCommon = useTranslations("common");
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
        <Modal
          open
          title={state.title}
          onClose={handleCancel}
          size="sm"
          footer={
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
              >
                {state.cancelLabel ?? tCommon("cancel")}
              </Button>
              <Button
                size="sm"
                variant={
                  state.variant === "danger"
                    ? "destructive"
                    : state.variant === "warning"
                      ? "primary"
                      : "primary"
                }
                onClick={handleConfirm}
              >
                {state.confirmLabel ?? tCommon("confirm")}
              </Button>
            </>
          }
        >
          <p className="text-sm text-ds-text-secondary">
            {state.message}
          </p>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}
