import { sendRequest } from "@/shared/lib/send-request";
import type { VerificationResult } from "../types";

export function verifySerial(serial: string, token: string): Promise<VerificationResult> {
  return sendRequest<VerificationResult>({
    method: "POST",
    url: "/verify",
    body: { serial, token },
  });
}
