"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { CertificateData } from "@/components/ui";
import { CertificateModal, LuxuryButton } from "@/components/ui";
import { usePieceCertificate } from "@/features/certificates";

interface CertificateViewerProps {
  pieceId: string;
  pieceName: string;
  serialNumber: string;
}

export function CertificateViewer({ pieceId, pieceName, serialNumber }: CertificateViewerProps) {
  const t = useTranslations("certificates");
  const wardrobeT = useTranslations("wardrobe");
  const [open, setOpen] = useState(false);
  const { fetchCertificate, data: rawCertificate, isPending, error } = usePieceCertificate();

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
    <>
      <LuxuryButton variant="ghost" loading={isPending} onClick={handleOpen}>
        {wardrobeT("viewCertificate")}
      </LuxuryButton>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-[var(--color-ruby)]">
          {error instanceof Error ? error.message : t("unavailable")}
        </p>
      ) : null}
      <CertificateModal open={open} onClose={() => setOpen(false)} certificate={certificate} />
    </>
  );
}
