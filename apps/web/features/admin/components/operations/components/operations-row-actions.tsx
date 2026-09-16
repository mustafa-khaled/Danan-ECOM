"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, CheckCircle2, XCircle, EllipsisVertical, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  approveStaffRequest,
  rejectStaffRequest,
} from "@/features/admin/api/fetch-admin-operations";
import { approveTransfer } from "@/features/admin/api/fetch-admin-transfers";
import type { OperationItem } from "../types";

interface OperationsRowActionsProps {
  operation: OperationItem;
}

export function OperationsRowActions({
  operation,
}: OperationsRowActionsProps) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-operations"] });
    queryClient.invalidateQueries({ queryKey: ["admin-operations-stats"] });
  };

  const approve = useMutation({
    mutationFn: async () => {
      if (operation.kind === "transfer") {
        await approveTransfer(operation.id);
        return;
      }
      return approveStaffRequest(operation.id);
    },
    onSuccess: (result) => {
      if (result && "houseKey" in result && result.houseKey) {
        window.alert(`House key issued once: ${result.houseKey}`);
      }
      invalidate();
    },
  });

  const reject = useMutation({
    mutationFn: async () => {
      // Transfer rejections require a reason — navigate to the detail page
      // where the full rejection form is available.
      if (operation.kind === "transfer") {
        router.push(`/admin/operations/${operation.id}?kind=transfer`);
        return;
      }
      await rejectStaffRequest(operation.id);
    },
    onSuccess: () => {
      if (operation.kind !== "transfer") invalidate();
    },
  });

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
        aria-label={`Actions for operation ${operation.requestNumber}`}
      >
        <EllipsisVertical className="size-5" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute end-0 top-full mt-1 z-30 w-44 rounded-lg border border-ds-border bg-ds-background shadow-lg py-1 animate-in fade-in zoom-in-95"
        >
          <Link
            href={`/admin/operations/${operation.id}?kind=${operation.kind}`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-ds-text hover:bg-ds-surface hover:text-(--color-gold) transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>{t("rowActions.view")}</span>
          </Link>

          {operation.status === "PENDING" && (
            <>
              <button
                type="button"
                disabled={approve.isPending || reject.isPending}
                onClick={() => {
                  setIsOpen(false);
                  approve.mutate();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors text-left"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{t("rowActions.approve")}</span>
              </button>
              <button
                type="button"
                disabled={approve.isPending || reject.isPending}
                onClick={() => {
                  setIsOpen(false);
                  reject.mutate();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>{t("rowActions.reject")}</span>
              </button>
            </>
          )}

          <Link
            href={`/admin/operations/${operation.id}/certificate?kind=${operation.kind}`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-ds-text hover:bg-ds-surface transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{t("rowActions.certificate")}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
