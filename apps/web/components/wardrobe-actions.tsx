"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CertificateViewer } from "@/components/certificate-viewer";
import { VerifyAuthenticityButton } from "@/components/verify-authenticity-button";
import { TransferInitiate } from "@/components/transfer-initiate";

interface WardrobeActionsProps {
  pieceId: string;
  pieceName: string;
  serialNumber: string;
  status: string;
  activeTransfer?: { id: string };
}

export function WardrobeActions({
  pieceId,
  pieceName,
  serialNumber,
  status,
  activeTransfer,
}: WardrobeActionsProps) {
  const t = useTranslations("wardrobe");

  return (
    <div className="w-full space-y-3">
      {/* Primary CTA: Transfer Ownership */}
      {status === "OWNED" && !activeTransfer ? (
        <TransferInitiate
          pieceId={pieceId}
          pieceName={pieceName}
          serialNumber={serialNumber}
        />
      ) : null}

      {/* Secondary Row: View Certificate + Verify Authenticity */}
      <div className="grid grid-cols-2 gap-3 sm:gap-3.5 w-full">
        <CertificateViewer
          pieceId={pieceId}
          pieceName={pieceName}
          serialNumber={serialNumber}
        />

        <VerifyAuthenticityButton
          pieceId={pieceId}
          serialNumber={serialNumber}
        />
      </div>

      {/* Active Transfer Notice */}
      {activeTransfer ? (
        <p className="text-sm text-ds-text-secondary font-body">
          {t("transferInProgress")}{" "}
          <Link
            href={`/beta/profile/transfers/${activeTransfer.id}`}
            className="text-ds-teal-800 underline-offset-4 hover:underline font-medium"
          >
            {t("viewTransfer")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
