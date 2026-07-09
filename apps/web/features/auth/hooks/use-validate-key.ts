import { useMutation } from "@tanstack/react-query";
import { validateHouseKey } from "../api/validate-key";

export function useValidateKey() {
  return useMutation({
    mutationFn: (houseKey: string) => validateHouseKey(houseKey),
  });
}
