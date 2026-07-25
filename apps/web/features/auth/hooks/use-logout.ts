import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminLogout } from "../api/logout";

export function useLogout() {
  const queryClient = useQueryClient();
  const {
    mutateAsync: logout,
    data,
    isPending,
    error,
  } = useMutation({
    mutationFn: (cookieHeader?: string) => adminLogout(cookieHeader),
    onSuccess: () => {
      queryClient.clear();
    },
  });

  return { logout, data, isPending, error };
}
