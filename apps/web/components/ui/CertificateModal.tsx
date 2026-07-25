"use client";

import { useLocale, useTranslations } from "next-intl";
import { LuxuryModal } from "./LuxuryModal";
import { SerialBadge } from "./SerialBadge";

/**
 * The certificate PDF link comes from the API (a same-origin relative path
 * in local dev, or an absolute presigned storage URL in production). Only
 * allow those two shapes as an `href` — rejects `javascript:`/`data:`/other
 * schemes in case the API response is ever compromised or misconfigured.
 */
function isSafeCertificateUrl(url: string): boolean {
  if (url.startsWith("/")) {
    return true;
  }
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

export interface CertificateData {
  certificateNumber: string;
  issuedAt: string;
  pdfUrl?: string | null;
  qrCodeData?: string | null;
  pieceName?: string;
  serialNumber?: string;
}

export interface CertificateModalProps {
  open: boolean;
  onClose: () => void;
  certificate: CertificateData | null;
}

export function CertificateModal({ open, onClose, certificate }: CertificateModalProps) {
  const t = useTranslations("certificates");
  const locale = useLocale();
  if (!certificate) return null;
  const issuedDate = new Date(certificate.issuedAt).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <LuxuryModal
      open={open}
      title={t("certificateOfAuthenticity")}
      onClose={onClose}
      footer={
        certificate.pdfUrl && isSafeCertificateUrl(certificate.pdfUrl) ? (
          <a
            href={certificate.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-button)] border border-[var(--color-gold)] bg-transparent px-6 text-sm tracking-[0.1em] uppercase text-[var(--color-gold)] transition-colors hover:bg-[var(--color-gold)] hover:text-[var(--color-void)]"
          >
            {t("downloadPdf")}
          </a>
        ) : null
      }
    >
      <div className="space-y-4">
        {certificate.pieceName ? (
          <p className="font-display text-lg text-[var(--color-ivory)]">{certificate.pieceName}</p>
        ) : null}
        {certificate.serialNumber ? <SerialBadge serial={certificate.serialNumber} /> : null}
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-[var(--color-border)] pb-2">
            <dt className="tracking-[0.1em] uppercase text-[var(--color-ivory-muted)]">
              {t("certificateNumber")}
            </dt>
            <dd className="font-mono text-[var(--color-ivory)]">{certificate.certificateNumber}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-[var(--color-border)] pb-2">
            <dt className="tracking-[0.1em] uppercase text-[var(--color-ivory-muted)]">
              {t("issuedLabel")}
            </dt>
            <dd className="text-[var(--color-ivory)]">{issuedDate}</dd>
          </div>
        </dl>
        {certificate.qrCodeData ? (
          <p className="text-xs leading-relaxed text-[var(--color-ivory-muted)]">{t("qrHint")}</p>
        ) : null}
      </div>
    </LuxuryModal>
  );
}
