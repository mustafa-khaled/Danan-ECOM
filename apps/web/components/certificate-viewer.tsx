"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileBadge } from "lucide-react";
import type { CertificateData } from "@/components/ui";
import { CertificateModal } from "@/components/ui";
import { usePieceCertificate } from "@/features/certificates";
import { DadanSpinner } from "@/shared/components/feedback/loading-state";

interface CertificateViewerProps {
  pieceId: string;
  pieceName: string;
  serialNumber: string;
}

export function CertificateViewer({
  pieceId,
  pieceName,
  serialNumber,
}: CertificateViewerProps) {
  const t = useTranslations("certificates");
  const wardrobeT = useTranslations("wardrobe");
  const [open, setOpen] = useState(false);
  const { fetchCertificate, data: rawCertificate, isPending, error } =
    usePieceCertificate();

  async function handleOpen() {
    try {
      const data = await fetchCertificate(pieceId);
      if (data) {
        setOpen(true);
      }
    } catch {
      /* error is rendered via the mutation's `error` state */
    }
  }

  const certificate: CertificateData | null = rawCertificate
    ? { ...rawCertificate, pieceName, serialNumber }
    : null;

  return (
    <div className="w-full">
      <button
        type="button"
        disabled={isPending}
        onClick={handleOpen}
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-[2px] border border-gray-200 bg-white px-4 text-center font-display text-sm font-semibold tracking-normal text-[#2D2321] transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
      >
        {isPending ? (
          <DadanSpinner size="sm" />
        ) : (
          <>
            <span>{wardrobeT("viewCertificate")}</span>
            <FileBadge className="size-4.5 text-[#2D2321]" />
          </>
        )}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-(--color-ruby)">
          {error instanceof Error ? error.message : t("unavailable")}
        </p>
      ) : null}
      <CertificateModal
        open={open}
        onClose={() => setOpen(false)}
        certificate={certificate}
      />
    </div>
  );
}
