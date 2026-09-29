import { VerifyForm } from "@/components/verify-form";
import type { VerificationResult } from "@/features/verify";

interface PublicVerifyContentProps {
  initialSerial?: string;
  initialToken?: string;
  initialResult?: VerificationResult | null;
  initialError?: string | null;
}

export function PublicVerifyContent({
  initialSerial,
  initialToken,
  initialResult,
  initialError,
}: PublicVerifyContentProps) {
  return (
    <VerifyForm
      initialSerial={initialSerial}
      initialToken={initialToken}
      initialResult={initialResult}
      initialError={initialError}
      fullWidth
      showAuthenticityMessage
    />
  );
}
