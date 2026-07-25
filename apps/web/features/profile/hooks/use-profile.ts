"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile as updateProfileApi } from "../api/profile";
import { profileKeys } from "@/shared/lib/query-keys";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const {
    mutateAsync: updateProfile,
    data,
    isPending,
    error,
  } = useMutation({
    mutationFn: (data: { phone?: string; locale?: string }) => updateProfileApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });

  return { updateProfile, data, isPending, error };
}
