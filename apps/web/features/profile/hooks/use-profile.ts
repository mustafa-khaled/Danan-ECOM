"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile as updateProfileApi } from "../api/profile";
import { profileKeys } from "@/shared/lib/query-keys";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const {
    mutateAsync: updateProfile,
    data,
    isPending,
    error,
  } = useMutation({
    mutationFn: (data: { phone?: string; locale?: string }) => updateProfileApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      router.refresh();
    },
  });

  return { updateProfile, data, isPending, error };
}
