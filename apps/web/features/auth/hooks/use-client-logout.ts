import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientLogout } from "../api/logout";

export function useClientLogout() {
  const queryClient = useQueryClient();
  const {
    mutateAsync: logout,
    data,
    isPending,
    error,
  } = useMutation({
    mutationFn: () => clientLogout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });

  return { logout, data, isPending, error };
}
