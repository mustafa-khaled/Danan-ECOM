import { sendRequest } from "@/shared/lib/send-request";
import type { VerificationResult } from "../types";

export function verifyPiece(serialNumber: string): Promise<VerificationResult> {
  return sendRequest<VerificationResult>({
    method: "GET",
    url: `/client/verify/${serialNumber}`,
  });
}
