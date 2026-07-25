import { useMutation } from "@tanstack/react-query";
import { fetchPieceCertificate } from "../api/fetch-piece-certificate";

export function usePieceCertificate() {
  const {
    mutateAsync: fetchCertificate,
    data,
    isPending,
    error,
  } = useMutation({
    mutationFn: (pieceId: string) => fetchPieceCertificate(pieceId),
  });

  return { fetchCertificate, data, isPending, error };
}
