"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { BadgeCheck } from "lucide-react";
import { CertificateViewer } from "@/components/certificate-viewer";
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

        <Link
          href="/beta/verify"
          className="flex h-12 w-full items-center justify-center gap-2.5 rounded-[2px] border border-gray-200 bg-white px-4 text-center font-display text-sm font-semibold tracking-normal text-[#2D2321] transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.99]"
        >
          <span>{t("verifyAuthenticity")}</span>
          <BadgeCheck className="size-4.5 text-[#2D2321]" />
        </Link>
      </div>

      {/* Active Transfer Notice */}
      {activeTransfer ? (
        <p className="text-sm text-gray-500">
          A transfer is in progress.{" "}
          <Link
            href={`/beta/transfers/${activeTransfer.id}`}
            className="text-[#4CBEAE] underline-offset-4 hover:underline font-medium"
          >
            View transfer
          </Link>
        </p>
      ) : null}
    </div>
  );
}
