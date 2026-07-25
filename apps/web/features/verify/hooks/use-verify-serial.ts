import { useMutation } from "@tanstack/react-query";
import { verifySerial as verifySerialApi } from "../api/verify-serial";

export function useVerifySerial() {
  const {
    mutateAsync: verifySerial,
    data,
    isPending,
    error,
  } = useMutation({
    mutationFn: ({ serial, token }: { serial: string; token: string }) =>
      verifySerialApi(serial, token),
  });

  return { verifySerial, data, isPending, error };
}
