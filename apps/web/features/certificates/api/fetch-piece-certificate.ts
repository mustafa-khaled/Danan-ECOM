import { sendRequest } from "@/shared/lib/send-request";
import type { CertificateData } from "../types";

export function fetchPieceCertificate(pieceId: string, cookieHeader?: string): Promise<CertificateData> {
  return sendRequest<CertificateData>({
    method: "GET",
    url: `/client/wardrobe/${pieceId}/certificate`,
    cookieHeader,
  });
}
