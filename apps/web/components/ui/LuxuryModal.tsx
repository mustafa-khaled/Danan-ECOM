"use client";

import { useEffect, useId, type ReactNode } from "react";
import { LuxuryButton } from "./LuxuryButton";

export interface LuxuryModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function LuxuryModal({ open, title, onClose, children, footer }: LuxuryModalProps) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close dialog overlay" className="absolute inset-0 bg-black/75" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-gold-glow)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-display text-2xl text-[var(--color-ivory)]">{title}</h2>
          <LuxuryButton variant="ghost" size="sm" onClick={onClose} aria-label="Close">{'\u2715'}</LuxuryButton>
        </div>
        <div className="text-[var(--color-ivory-muted)]">{children}</div>
        {footer ? <div className="mt-6 flex justify-end gap-3">{footer}</div> : null}
      </div>
    </div>
  );
}
