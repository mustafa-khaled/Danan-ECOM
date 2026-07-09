import { useMutation } from "@tanstack/react-query";
import { fetchPieceCertificate } from "../api/fetch-piece-certificate";
import type { CertificateData } from "../types";

export function usePieceCertificate() {
  return useMutation({
    mutationFn: (pieceId: string) => fetchPieceCertificate(pieceId),
  });
}
