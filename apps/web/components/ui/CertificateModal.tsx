"use client";

import { useLocale, useTranslations } from "next-intl";
import { Modal } from "./Modal";
import { Button } from "./Button";
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
  pieceId?: string;
}

export function CertificateModal({ open, onClose, certificate, pieceId }: CertificateModalProps) {
  const t = useTranslations("certificates");
  const locale = useLocale();
  if (!certificate) return null;
  const issuedDate = new Date(certificate.issuedAt).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <Modal
      open={open}
      title={t("certificateOfAuthenticity")}
      onClose={onClose}
      footer={
        certificate.pdfUrl && isSafeCertificateUrl(certificate.pdfUrl) ? (
          <a
            href={certificate.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="md">
              {t("downloadPdf")}
            </Button>
          </a>
        ) : null
      }
    >
      <div className="space-y-4">
        {certificate.pieceName ? (
          <p className="ds-h5 text-ds-text">{certificate.pieceName}</p>
        ) : null}
        {certificate.serialNumber ? <SerialBadge serial={certificate.serialNumber} /> : null}
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-ds-border pb-2">
            <dt className="tracking-widest uppercase text-ds-text-secondary">
              {t("certificateNumber")}
            </dt>
            <dd className="font-mono text-ds-text">{certificate.certificateNumber}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-ds-border pb-2">
            <dt className="tracking-widest uppercase text-ds-text-secondary">
              {t("issuedLabel")}
            </dt>
            <dd className="text-ds-text">{issuedDate}</dd>
          </div>
        </dl>
        {certificate.qrCodeData ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-ds-border-light bg-white p-4">
            {pieceId ? (
              // Same-origin via the /backend proxy, so the session cookie is
              // forwarded and the request satisfies `img-src 'self'`.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/backend/client/wardrobe/${pieceId}/certificate/qr`}
                alt={t("qrAlt")}
                width={160}
                height={160}
                className="size-40 rounded-sm"
              />
            ) : null}
            <p className="text-center text-xs leading-relaxed text-ds-text-muted">
              {t("qrHint")}
            </p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
