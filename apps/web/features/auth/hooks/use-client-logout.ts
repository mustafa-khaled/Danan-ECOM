import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientLogout } from "../api/logout";

export function useClientLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clientLogout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
