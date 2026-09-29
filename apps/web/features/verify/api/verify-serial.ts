import { sendRequest } from "@/shared/lib/send-request";
import type { VerificationResult } from "../types";

/**
 * Without a timeout, `sendRequest` never arms its AbortController, so a request
 * that stalls mid-flight leaves the mutation pending forever — the form then
 * sits with disabled inputs and no result, recoverable only by a page reload.
 */
export const VERIFY_TIMEOUT_MS = 15_000;

export function verifySerial(serial: string, token: string): Promise<VerificationResult> {
  return sendRequest<VerificationResult>({
    method: "POST",
    url: "/verify",
    body: { serial, token },
    timeout: VERIFY_TIMEOUT_MS,
  });
}
