import { useMutation } from "@tanstack/react-query";
import { validateHouseKey } from "../api/validate-key";

export function useValidateKey() {
  const {
    mutateAsync: validateKey,
    data,
    isPending,
    error,
  } = useMutation({
    mutationFn: (houseKey: string) => validateHouseKey(houseKey),
  });

  return { validateKey, data, isPending, error };
}
