"use client";

import { VerifyForm } from "@/components/verify-form";

interface PublicVerifyContentProps {
  initialSerial?: string;
  initialToken?: string;
}

export function PublicVerifyContent({
  initialSerial,
  initialToken,
}: PublicVerifyContentProps) {
  return (
    <VerifyForm
      initialSerial={initialSerial}
      initialToken={initialToken}
      autoVerify={!!(initialSerial && initialToken)}
      fullWidth
      showAuthenticityMessage
    />
  );
}
