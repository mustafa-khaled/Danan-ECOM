import { sendRequest } from "@/shared/lib/send-request";
import type { VerificationResult } from "../types";
import { VERIFY_TIMEOUT_MS } from "./verify-serial";

/**
 * Server-side verification used by the verify pages to render the result on
 * first paint, so a QR link and a client-side navigation reach the same state.
 */
export function fetchVerification(
  serial: string,
  token: string,
): Promise<VerificationResult> {
  return sendRequest<VerificationResult>({
    method: "GET",
    url: "/verify",
    params: { serial, token },
    timeout: VERIFY_TIMEOUT_MS,
  });
}
