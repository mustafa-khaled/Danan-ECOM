"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BadgeCheck } from "lucide-react";
import { usePieceCertificate } from "@/features/certificates";
import { Button } from "@/components/ui/Button";

interface VerifyAuthenticityButtonProps {
  pieceId: string;
  serialNumber: string;
}

/**
 * Fetches the piece's certificate purely to recover the HMAC verification token
 * that `qrCodeData` already carries, then deep-links to the verify page with both
 * values in the query string. The verify page auto-submits when it sees them, so
 * the user lands on a result instead of an empty form.
 *
 * The token is derived server-side and never recomputed in the browser — the
 * signing secret stays on the API.
 */
export function VerifyAuthenticityButton({
  pieceId,
  serialNumber,
}: VerifyAuthenticityButtonProps) {
  const router = useRouter();
  const t = useTranslations("wardrobe");
  const certificateT = useTranslations("certificates");
  const { fetchCertificate, isPending, error } = usePieceCertificate();

  async function handleClick() {
    try {
      const certificate = await fetchCertificate(pieceId);
      const qrCodeData = certificate?.qrCodeData;
      if (!qrCodeData) return;

      const url = new URL(qrCodeData);
      const token = url.searchParams.get("token");
      if (!token) return;

      router.push(
        `/beta/verify?serial=${encodeURIComponent(serialNumber)}&token=${encodeURIComponent(token)}`,
      );
    } catch {
      /* error is rendered via the mutation's `error` state */
    }
  }

  return (
    <div className="w-full">
      <Button
        type="button"
        variant="outline"
        size="lg"
        fullWidth
        loading={isPending}
        onClick={handleClick}
        className="lg:px-8 px-3"
        iconRight={<BadgeCheck className="size-[16px]" />}
      >
        {t("verifyAuthenticity")}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-ds-error font-body">
          {error instanceof Error ? error.message : certificateT("unavailable")}
        </p>
      ) : null}
    </div>
  );
}
