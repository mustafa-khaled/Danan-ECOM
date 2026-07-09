import { useMutation } from "@tanstack/react-query";
import { verifySerial } from "../api/verify-serial";

export function useVerifySerial() {
  return useMutation({
    mutationFn: ({ serial, token }: { serial: string; token: string }) =>
      verifySerial(serial, token),
  });
}
