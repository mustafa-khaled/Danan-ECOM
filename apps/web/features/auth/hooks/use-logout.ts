import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminLogout } from "../api/logout";

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cookieHeader?: string) => adminLogout(cookieHeader),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
