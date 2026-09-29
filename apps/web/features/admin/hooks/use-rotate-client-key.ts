"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rotateClientKey } from "../api/fetch-admin-clients";

export function useRotateClientKey() {
  const queryClient = useQueryClient();

  const { mutateAsync, data, isPending, error, reset } = useMutation({
    mutationFn: (clientId: string) => rotateClientKey(clientId),
    onSuccess: () => {
      // Cached client rows carry houseKeyPrefix, which rotation replaces.
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
    },
  });

  return { rotateKey: mutateAsync, houseKey: data?.houseKey, isPending, error, reset };
}
