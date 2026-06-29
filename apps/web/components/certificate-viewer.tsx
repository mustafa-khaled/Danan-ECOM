"use client";

import { useState } from "react";
import type { CertificateData } from "@dadan/ui";
import { CertificateModal, LuxuryButton } from "@dadan/ui";
import { ApiError, fetchCertificate } from "../lib/api";

interface CertificateViewerProps {
  pieceId: string;
  pieceName: string;
  serialNumber: string;
}

export function CertificateViewer({ pieceId, pieceName, serialNumber }: CertificateViewerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleOpen() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCertificate(pieceId);
      setCertificate({
        ...data,
        pieceName,
        serialNumber,
      });
      setOpen(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Certificate unavailable");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <LuxuryButton variant="ghost" loading={loading} onClick={handleOpen}>
        View Certificate
      </LuxuryButton>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-[var(--color-ruby)]">
          {error}
        </p>
      ) : null}
      <CertificateModal open={open} onClose={() => setOpen(false)} certificate={certificate} />
    </>
  );
}
