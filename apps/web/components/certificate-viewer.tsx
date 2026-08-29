"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileBadge } from "lucide-react";
import type { CertificateData } from "@/components/ui";
import { CertificateModal } from "@/components/ui";
import { usePieceCertificate } from "@/features/certificates";
import { Button } from "@/components/ui/Button";

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
  const {
    fetchCertificate,
    data: rawCertificate,
    isPending,
    error,
  } = usePieceCertificate();

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
      <Button
        type="button"
        loading={isPending}
        onClick={handleOpen}
        variant="outline"
        size="lg"
        fullWidth
        className="lg:px-8 px-3"
        iconRight={<FileBadge className="size-[16px]" />}
      >
        {wardrobeT("viewCertificate")}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-ds-error font-body">
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
