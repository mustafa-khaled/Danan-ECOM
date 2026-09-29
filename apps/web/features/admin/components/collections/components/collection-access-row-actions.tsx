"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Eye, Pencil, KeyRound, MoreVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { useConfirm } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAdmin } from "@/shared/providers/admin-context";
import { useRotateClientKey } from "@/features/admin/hooks/use-rotate-client-key";
import type { AdminClientListItem } from "@/features/admin/types";

interface CollectionAccessRowActionsProps {
  member: AdminClientListItem;
}

export function CollectionAccessRowActions({ member }: CollectionAccessRowActionsProps) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const confirm = useConfirm();
  // Rotation is SUPER_ADMIN-only on the API, so hide it from everyone else
  // rather than letting the click fail with a 403.
  const { canWrite, isSuperAdmin } = useAdmin();
  const { rotateKey, houseKey, isPending, error, reset } = useRotateClientKey();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  async function handleRotate() {
    setIsOpen(false);
    const confirmed = await confirm({
      title: t("rotateKey.confirmTitle"),
      message: t("rotateKey.confirmMessage", { name: member.displayName }),
      confirmLabel: t("rotateKey.confirmLabel"),
      variant: "danger",
    });
    if (!confirmed) return;
    // mutateAsync rejects on failure; the mutation's `error` drives the dialog
    // below, so swallow it here only to avoid an unhandled rejection.
    await rotateKey(member.id).catch(() => undefined);
  }

  async function handleCopy() {
    if (!houseKey) return;
    await navigator.clipboard.writeText(houseKey);
    setCopied(true);
  }

  function closeReveal() {
    setCopied(false);
    reset();
  }

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="h-8 w-8 rounded-lg flex items-center justify-center text-ds-text-secondary hover:text-ds-text hover:bg-ds-surface transition-colors focus:outline-none"
        aria-expanded={isOpen}
        aria-label="Member actions"
      >
        <MoreVertical className="size-6" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-e-0 top-full mt-1 z-30 w-40 rounded-lg border border-ds-border bg-ds-background shadow-lg py-1 animate-in fade-in zoom-in-95"
        >
          <Link
            href={`/admin/members/${member.id}`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-ds-text hover:bg-ds-surface hover:text-(--color-gold) transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>{t("rowActions.view")}</span>
          </Link>
          {canWrite && (
            <Link
              href={`/admin/members/${member.id}/edit`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-ds-text hover:bg-ds-surface hover:text-(--color-gold) transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>{t("rowActions.edit")}</span>
            </Link>
          )}
          {isSuperAdmin && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleRotate}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-ds-text hover:bg-ds-surface hover:text-(--color-gold) transition-colors text-left disabled:opacity-50"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>{t("rowActions.rotateKey")}</span>
            </button>
          )}
        </div>
      )}

      <Modal
        open={Boolean(houseKey)}
        title={t("rotateKey.revealTitle")}
        onClose={closeReveal}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={handleCopy}>
              {copied ? t("rotateKey.copied") : t("rotateKey.copy")}
            </Button>
            <Button onClick={closeReveal}>{tCommon("close")}</Button>
          </>
        }
      >
        <p className="mb-4 text-sm">{t("rotateKey.revealMessage")}</p>
        <code className="block rounded-lg bg-ds-surface px-3 py-2 font-mono text-sm break-all text-ds-text">
          {houseKey}
        </code>
      </Modal>

      <Modal
        open={Boolean(error)}
        title={t("rotateKey.errorTitle")}
        onClose={reset}
        size="sm"
        footer={<Button onClick={reset}>{tCommon("close")}</Button>}
      >
        <p className="text-sm">{t("rotateKey.errorMessage")}</p>
      </Modal>
    </div>
  );
}
