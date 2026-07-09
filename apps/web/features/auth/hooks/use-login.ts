import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/shared/lib/query-keys";
import { adminLogin } from "../api/login";

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      adminLogin(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.adminMe() });
    },
  });
}
