"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "../api/profile";
import { profileKeys } from "@/shared/lib/query-keys";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { phone?: string; locale?: string }) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}
